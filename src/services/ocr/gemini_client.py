"""Gemini 2.5 Flash API Client for OCR tasks.

Sends document images to Google Gemini Flash models via OpenAI-compatible endpoint.
"""

import logging
import re
import time
from typing import Optional

import requests

from src.config import get_settings
from src.prompts.ocr_prompts import QWEN_OCR_SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class GeminiVLClient:
    """Client for calling Google Gemini Vision API (e.g. gemini-2.5-flash) for OCR tasks."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        max_retries: int = 3,
        timeout_seconds: int = 120,
    ):
        """Initialize Gemini Vision API client.

        Args:
            api_key: API Key for Gemini service (GEMINI_API_KEY or GOOGLE_API_KEY).
            base_url: OpenAI-compatible endpoint URL.
            model: Model identifier (e.g., 'gemini-2.5-flash', 'gemini-2.0-flash').
            max_retries: Number of retries on transient errors. Default 3.
            timeout_seconds: HTTP request timeout in seconds. Default 120.
        """
        settings = get_settings()
        self.api_key = (
            api_key
            if api_key is not None
            else (settings.gemini_api_key or settings.google_api_key)
        )
        self.base_url = (
            base_url if base_url is not None else settings.gemini_base_url
        ).rstrip("/")
        self.model = model if model is not None else settings.gemini_model
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds

    def _clean_markdown_fences(self, text: str) -> str:
        """Strip markdown code fence blocks if returned by the model."""
        if not text:
            return ""

        cleaned = text.strip()
        cleaned = re.sub(
            r"^```(?:markdown|md)?\s*\n?", "", cleaned, flags=re.IGNORECASE
        )
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)
        return cleaned.strip()

    def process_page_image(
        self, image_b64_uri: str, system_prompt: Optional[str] = None
    ) -> str:
        """Send a single image page to Gemini for OCR transcription.

        Args:
            image_b64_uri: Base64 data URI string (data:image/jpeg;base64,...).
            system_prompt: Optional prompt override.

        Returns:
            Clean Markdown string transcribed from the page image.
        """
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY or GOOGLE_API_KEY is not set. Please add it to your .env file."
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
                logger.info(
                    f"Sending page request to Gemini API ({self.model}, attempt {attempt}/{self.max_retries})"
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
                        logger.warning("Empty choices returned from Gemini API response.")
                        return ""

                    choice = choices[0]
                    finish_reason = choice.get("finish_reason", "")
                    content = choice.get("message", {}).get("content", "")

                    if finish_reason == "RECITATION" or not content:
                        logger.warning(
                            f"Gemini API filtered output (finish_reason='{finish_reason}'). "
                            "Google Gemini blocks exact transcription of known public drug leaflets via its RECITATION filter."
                        )

                    cleaned_content = self._clean_markdown_fences(content)
                    return cleaned_content

                logger.warning(
                    f"Gemini API returned status {response.status_code}: {response.text}"
                )
                last_error = f"HTTP {response.status_code}: {response.text}"

                if response.status_code in (429, 500, 502, 503, 504):
                    time.sleep(2**attempt)
                    continue
                else:
                    break

            except requests.RequestException as e:
                logger.warning(f"Gemini API request exception on attempt {attempt}: {e}")
                last_error = str(e)
                time.sleep(2**attempt)

        raise RuntimeError(
            f"Failed to complete Gemini OCR request after {attempt} attempts. Last error: {last_error}"
        )
