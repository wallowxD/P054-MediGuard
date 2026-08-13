"""Cửa duy nhất gọi Google GenAI cho tóm tắt có cấu trúc và ingestion."""

import asyncio
import json
import os
from typing import Any, TypeVar

from pydantic import BaseModel

from medsafe.config import get_settings

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover - môi trường tối thiểu không cài provider
    genai = None
    types = None

T = TypeVar("T", bound=BaseModel)


class GeminiRateLimitError(Exception):
    """Provider từ chối do quota/rate limit."""


def repair_truncated_json(raw_json: str) -> dict[str, Any]:
    """Giữ tương thích ingestion cũ; request path không dùng cơ chế sửa output này."""
    cleaned = raw_json.strip().removeprefix("```json").removesuffix("```").strip()
    try:
        value = json.loads(cleaned)
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        return {}


class LLMClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        settings = get_settings()
        self.model = model or os.getenv("GEMINI_MODEL") or settings.gemini_model
        key = api_key or os.getenv("GEMINI_API_KEY") or settings.gemini_api_key
        self.client = genai.Client(api_key=key) if genai is not None and key else None

    async def generate_structured(
        self,
        prompt: str,
        response_schema: type[T],
        *,
        system: str,
        timeout_seconds: float = 5.0,
    ) -> T:
        """Một request async, structured output, không retry trên request path."""
        if self.client is None or types is None:
            raise RuntimeError("Chưa cấu hình GEMINI_API_KEY hoặc google-genai.")
        response = await asyncio.wait_for(
            self.client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                ),
            ),
            timeout=timeout_seconds,
        )
        if response.parsed is not None:
            return response_schema.model_validate(response.parsed)
        return response_schema.model_validate_json(response.text or "")

    def complete(self, prompt: str, *, system: str | None = None, max_retries: int = 1) -> str:
        """API đồng bộ giữ tương thích ingestion; không tự retry."""
        del max_retries
        if self.client is None or types is None:
            raise RuntimeError("Chưa cấu hình GEMINI_API_KEY hoặc google-genai.")
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=system),
        )
        return response.text or ""

    def complete_json(self, prompt: str, schema_description: str = "", *, system: str | None = None) -> dict[str, Any]:
        """Adapter JSON cho ingestion hiện hữu."""
        if schema_description:
            prompt = f"{prompt}\n\nCấu trúc JSON bắt buộc:\n{schema_description}"
        return repair_truncated_json(self.complete(prompt, system=system))
