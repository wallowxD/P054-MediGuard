"""Qwen3-VL Flash API Client.

Gửi ảnh HDSD tới Qwen3-VL Flash model và nhận về Markdown.
"""

import logging
import re
import time

import requests

from medsafe.config import get_settings
from medsafe.prompts.ocr_prompts import QWEN_OCR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class QwenVLClient:
    """Client gọi Qwen3-VL Flash Vision API cho OCR."""

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        max_retries: int = 3,
        timeout_seconds: int = 120,
    ):
        settings = get_settings()
        self.api_key = api_key if api_key is not None else getattr(settings, "qwen_api_key", getattr(settings, "dashscope_api_key", ""))
        self.base_url = (
            base_url if base_url is not None else getattr(settings, "qwen_base_url", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1")
        ).rstrip("/")
        self.model = model if model is not None else getattr(settings, "qwen_model", "qwen3-vl-flash")
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds

    def _clean_markdown_fences(self, text: str) -> str:
        if not text:
            return ""

        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:markdown|md)?\s*\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        return cleaned.strip()

    def process_page_image(
        self, image_b64_uri: str, system_prompt: str | None = None
    ) -> str:
        if not self.api_key:
            raise ValueError(
                "QWEN_API_KEY / DASHSCOPE_API_KEY is not set. Please provide it in .env or settings."
            )

        endpoint = f"{self.base_url}/chat/completions"
        prompt_text = system_prompt or QWEN_OCR_SYSTEM_PROMPT

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
                logger.debug(
                    f"Sending page request to Qwen API (attempt {attempt}/{self.max_retries})"
                )
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
                        logger.warning("Empty choices returned from Qwen API response.")
                        return ""

                    content = choices[0].get("message", {}).get("content", "")
                    cleaned_content = self._clean_markdown_fences(content)
                    return cleaned_content

                logger.warning(
                    f"Qwen API returned status {response.status_code}: {response.text}"
                )
                last_error = f"HTTP {response.status_code}: {response.text}"

                if response.status_code in (429, 500, 502, 503, 504):
                    time.sleep(2**attempt)
                    continue
                else:
                    break

            except requests.RequestException as e:
                logger.warning(f"Request exception on attempt {attempt}: {e}")
                last_error = str(e)
                time.sleep(2**attempt)

        raise RuntimeError(
            f"Failed to complete OCR request after {attempt} attempts. Last error: {last_error}"
        )
