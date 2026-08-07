"""Gemini 2.5/3.6 Flash API Client cho tác vụ OCR.

Gửi ảnh HDSD tới Google Gemini Flash qua google-genai SDK hoặc OpenAI-compatible endpoint.
Hỗ trợ cả hai chế độ Vertex AI và Google AI Studio.
"""

import base64
import logging
import os
import random
import re
import time
from pathlib import Path

import requests

from medsafe.config import get_settings
from medsafe.prompts.ocr_prompts import GEMINI_MEDICAL_OCR_SYSTEM_PROMPT

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

logger = logging.getLogger(__name__)


def calculate_backoff_with_jitter(attempt: int) -> float:
    """Calculate exponential backoff wait time with uniform random jitter.

    Attempt 1: 1–2s  (2^0 to 2^1)
    Attempt 2: 2–4s  (2^1 to 2^2)
    Attempt 3: 4–8s  (2^2 to 2^3)
    Attempt 4: 8–16s (2^3 to 2^4)
    """
    min_sec = float(2 ** (attempt - 1))
    max_sec = float(2**attempt)
    return random.uniform(min_sec, max_sec)


class GeminiVLClient:
    """Client gọi Google Gemini Vision API cho OCR."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        use_vertex: bool = False,
        project: str | None = None,
        location: str | None = None,
        max_retries: int = 4,
        timeout_seconds: int = 120,
    ):
        settings = get_settings()
        self.api_key = (
            api_key
            if api_key is not None
            else (
                os.getenv("VERTEX_API_KEY")
                or getattr(settings, "vertex_api_key", "")
                or getattr(settings, "gemini_api_key", "")
                or settings.google_api_key
            )
        )
        self.base_url = (
            base_url
            if base_url is not None
            else getattr(settings, "gemini_base_url", "https://generativelanguage.googleapis.com/v1beta/openai")
        ).rstrip("/")
        self.model = (
            model
            if model is not None
            else (os.getenv("GEMINI_MODEL") or getattr(settings, "gemini_model", "gemini-3.6-flash"))
        )
        self.use_vertex = (
            use_vertex
            or getattr(settings, "use_vertex_ai", False)
            or os.getenv("USE_VERTEX_AI", "").lower() in ("true", "1", "yes")
        )
        self.project = (
            project
            or getattr(settings, "gcp_project", "")
            or os.getenv("GCP_PROJECT")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
        )
        self.location = (
            location or getattr(settings, "gcp_location", "us-central1") or os.getenv("GCP_LOCATION") or "us-central1"
        )
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds

        self._genai_client = None
        self._init_genai_client()

    def _init_genai_client(self):
        try:
            from google import genai

            if self.use_vertex:
                kwargs = {"vertexai": True}
                if self.api_key:
                    kwargs["api_key"] = self.api_key
                else:
                    if self.project:
                        os.environ["GOOGLE_CLOUD_PROJECT"] = self.project
                        os.environ["GCP_PROJECT"] = self.project
                        kwargs["project"] = self.project
                    if self.location:
                        kwargs["location"] = self.location

                kwargs["http_options"] = types.HttpOptions(timeout=120000)
                self._genai_client = genai.Client(**kwargs)
                logger.info(f"Initialized Gemini Client via Vertex AI (model={self.model})")

            elif self.api_key:
                self._genai_client = genai.Client(api_key=self.api_key, http_options=types.HttpOptions(timeout=120000))
                logger.info(f"Initialized Gemini Client via AI Studio (model={self.model})")

        except Exception as e:
            logger.warning(f"Could not initialize google.genai Client: {e}. Will fall back to HTTP endpoint.")
            self._genai_client = None

    def _clean_markdown_fences(self, text: str) -> str:
        if not text:
            return ""

        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:markdown|md)?\s*\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        return cleaned.strip()

    def process_image_file(
        self,
        image_path: str | Path,
        system_prompt: str | None = None,
    ) -> str:
        image_path = Path(image_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        prompt_text = system_prompt or GEMINI_MEDICAL_OCR_SYSTEM_PROMPT

        if self._genai_client is not None:
            return self._process_image_sdk(image_path, prompt_text)

        image_bytes = image_path.read_bytes()
        ext = image_path.suffix.lower().lstrip(".")
        mime_type = f"image/{ext}" if ext in ("png", "jpg", "jpeg", "webp") else "image/png"
        b64_str = base64.b64encode(image_bytes).decode("utf-8")
        image_b64_uri = f"data:{mime_type};base64,{b64_str}"

        return self.process_page_image(image_b64_uri, system_prompt=prompt_text)

    def _process_image_sdk(
        self,
        image_path: Path,
        prompt_text: str,
    ) -> str:
        from google.genai import types

        image_bytes = image_path.read_bytes()
        ext = image_path.suffix.lower().lstrip(".")
        mime_type = "image/png" if ext == "png" else ("image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}")

        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        attempt = 0
        last_error = None

        while attempt < self.max_retries:
            attempt += 1
            try:
                logger.info(
                    f"Sending OCR request for {image_path.name} to Gemini ({self.model}, attempt {attempt}/{self.max_retries})"
                )

                response = self._genai_client.models.generate_content(
                    model=self.model,
                    contents=[
                        image_part,
                        "Hãy chuyển đổi trang ảnh này thành định dạng Markdown (.md) sạch và chuẩn xác theo đúng quy tắc.",
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=prompt_text,
                        temperature=0.0,
                        max_output_tokens=8192,
                    ),
                )

                content = response.text or ""
                cleaned = self._clean_markdown_fences(content)
                return cleaned

            except Exception as e:
                err_str = str(e)
                logger.warning(f"SDK request exception on attempt {attempt} for {image_path.name}: {err_str}")
                last_error = err_str

                if "invalid_argument" in err_str.lower() or "unauthorized" in err_str.lower():
                    raise ValueError(f"Gemini API Authentication Failed: {err_str}") from e

                wait_time = calculate_backoff_with_jitter(attempt)
                logger.warning(
                    f"SDK request exception on attempt {attempt}/{self.max_retries} for {image_path.name}: {err_str}. "
                    f"Retrying in {wait_time:.2f}s (exponential backoff + jitter)..."
                )
                time.sleep(wait_time)
                continue

        raise RuntimeError(
            f"Failed Gemini SDK OCR request for {image_path.name} after {attempt} attempts. Error: {last_error}"
        )

    def process_page_image(self, image_b64_uri: str, system_prompt: str | None = None) -> str:
        prompt_text = system_prompt or GEMINI_MEDICAL_OCR_SYSTEM_PROMPT

        # Nếu có _genai_client (SDK Vertex AI / AI Studio), ưu tiên sử dụng SDK
        if self._genai_client is not None:
            from google.genai import types

            if "," in image_b64_uri:
                header, b64_data = image_b64_uri.split(",", 1)
                mime_type = header.split(";")[0].replace("data:", "") if "data:" in header else "image/jpeg"
            else:
                b64_data = image_b64_uri
                mime_type = "image/jpeg"

            img_bytes = base64.b64decode(b64_data)
            image_part = types.Part.from_bytes(data=img_bytes, mime_type=mime_type)

            attempt = 0
            last_error = None
            while attempt < self.max_retries:
                attempt += 1
                try:
                    logger.info(
                        f"Sending page OCR request to Gemini via SDK ({self.model}, attempt {attempt}/{self.max_retries})"
                    )
                    response = self._genai_client.models.generate_content(
                        model=self.model,
                        contents=[
                            image_part,
                            "Hãy chuyển đổi trang ảnh này thành định dạng Markdown (.md) sạch và chuẩn xác theo đúng quy tắc.",
                        ],
                        config=types.GenerateContentConfig(
                            system_instruction=prompt_text,
                            temperature=0.0,
                            max_output_tokens=8192,
                        ),
                    )
                    content = response.text or ""
                    return self._clean_markdown_fences(content)
                except Exception as e:
                    err_str = str(e)
                    last_error = err_str
                    if "invalid_argument" in err_str.lower() or "unauthorized" in err_str.lower():
                        raise ValueError(f"Gemini API Authentication Failed: {err_str}") from e

                    wait_time = calculate_backoff_with_jitter(attempt)
                    logger.warning(
                        f"SDK page OCR exception on attempt {attempt}/{self.max_retries}: {err_str}. "
                        f"Retrying in {wait_time:.2f}s (exponential backoff + jitter)..."
                    )
                    time.sleep(wait_time)
                    continue

            raise RuntimeError(f"Failed Gemini SDK page OCR request after {attempt} attempts: {last_error}")

        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY, GOOGLE_API_KEY or VERTEX_API_KEY is not set. Please provide API Key or set environment variables."
            )

        endpoint = f"{self.base_url}/chat/completions"

        prompt_text = system_prompt or GEMINI_MEDICAL_OCR_SYSTEM_PROMPT

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": image_b64_uri},
                        },
                        {
                            "type": "text",
                            "text": prompt_text,
                        },
                    ],
                }
            ],
            "temperature": 0.0,
        }

        attempt = 0
        last_error = None

        while attempt < self.max_retries:
            attempt += 1
            try:
                logger.info(f"Sending HTTP request to Gemini API ({self.model}, attempt {attempt}/{self.max_retries})")
                response = requests.post(
                    endpoint,
                    json=payload,
                    headers=headers,
                    timeout=self.timeout_seconds,
                )

                if response.status_code == 200:
                    res_data = response.json()
                    choices = res_data.get("choices", [])
                    if not choices:
                        logger.warning("Empty choices returned from Gemini API response.")
                        return ""

                    choice = choices[0]
                    finish_reason = choice.get("finish_reason", "")
                    content = choice.get("message", {}).get("content", "")

                    if finish_reason == "RECITATION" or not content:
                        logger.warning(f"Gemini API filtered output (finish_reason='{finish_reason}').")

                    cleaned_content = self._clean_markdown_fences(content)
                    return cleaned_content

                logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
                last_error = f"HTTP {response.status_code}: {response.text}"

                if response.status_code in (429, 500, 502, 503, 504):
                    wait_time = calculate_backoff_with_jitter(attempt)
                    logger.warning(
                        f"Gemini API returned status {response.status_code} on attempt {attempt}/{self.max_retries}. "
                        f"Retrying in {wait_time:.2f}s (exponential backoff + jitter)..."
                    )
                    time.sleep(wait_time)
                    continue
                else:
                    break

            except requests.RequestException as e:
                wait_time = calculate_backoff_with_jitter(attempt)
                logger.warning(
                    f"Gemini API request exception on attempt {attempt}/{self.max_retries}: {e}. "
                    f"Retrying in {wait_time:.2f}s (exponential backoff + jitter)..."
                )
                last_error = str(e)
                time.sleep(wait_time)

        raise RuntimeError(f"Failed to complete Gemini OCR request after {attempt} attempts. Last error: {last_error}")
