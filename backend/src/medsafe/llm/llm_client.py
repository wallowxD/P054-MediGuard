"""Cửa duy nhất gọi Google GenAI cho tóm tắt có cấu trúc và ingestion."""

import asyncio
import json
import os
from collections.abc import Sequence
from typing import Any, NoReturn, TypeVar

from pydantic import BaseModel

from medsafe.config import get_settings

try:
    from google import genai
    from google.genai import errors as genai_errors
    from google.genai import types
except ImportError:  # pragma: no cover - môi trường tối thiểu không cài provider
    genai = None
    genai_errors = None
    types = None

T = TypeVar("T", bound=BaseModel)


class GeminiRateLimitError(Exception):
    """Provider từ chối do quota/rate limit."""


class GeminiUnavailableError(Exception):
    """Provider tạm thời quá tải hoặc không sẵn sàng."""


def _translate_provider_error(error: Exception) -> NoReturn:
    """Đổi lỗi SDK thành lỗi ổn định mà tầng service có thể xử lý, không lộ response thô."""
    if genai_errors is None or not isinstance(error, genai_errors.APIError):
        raise error
    if error.code == 429:
        raise GeminiRateLimitError from error
    if error.code in {500, 502, 503, 504}:
        raise GeminiUnavailableError from error
    raise error


def repair_truncated_json(raw_json: str) -> dict[str, Any]:
    """Tự động vá lỗi JSON bị cắt ngang do max_tokens."""
    cleaned = raw_json.strip()
    if "```json" in cleaned:
        parts = cleaned.split("```json")
        cleaned = parts[1]
        if "```" in cleaned:
            cleaned = cleaned.split("```")[0]
        cleaned = cleaned.strip()
    elif "```" in cleaned:
        parts = cleaned.split("```")
        cleaned = parts[1] if len(parts) > 1 else parts[0]
        cleaned = cleaned.strip()

    # Thử load trực tiếp trước
    try:
        value = json.loads(cleaned)
        return value if isinstance(value, dict) else {}
    except json.JSONDecodeError:
        return {}

    # Vá chuỗi string bị cắt dở
    pos = max(cleaned.rfind("}"), cleaned.rfind("]"))
    if pos != -1:
        truncated_candidate = cleaned[: pos + 1]
        if not truncated_candidate.endswith("}"):
            truncated_candidate += "}"
        try:
            return json.loads(truncated_candidate)
        except json.JSONDecodeError:
            pass


class LLMClient:
    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        settings = get_settings()
        self.model = model or os.getenv("GEMINI_MODEL") or settings.gemini_model
        key = (
            api_key
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_API_KEY")
            or settings.gemini_api_key
            or settings.google_api_key
        )
        self.client = (
            genai.Client(
                api_key=key,
                # SDK mặc định retry 5 lần với 429/5xx. Trên request path điều này che lỗi 503
                # thành timeout 504 và giữ người dùng chờ lâu; retry do người dùng chủ động.
                http_options=types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=1)),
            )
            if genai is not None and types is not None and key
            else None
        )

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
        try:
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
        except TimeoutError:
            raise
        except Exception as exc:
            _translate_provider_error(exc)
        if response.parsed is not None:
            return response_schema.model_validate(response.parsed)
        return response_schema.model_validate_json(response.text or "")

    async def generate_structured_with_images(
        self,
        prompt: str,
        response_schema: type[T],
        *,
        system: str,
        images: Sequence[tuple[bytes, str]],
        timeout_seconds: float = 30.0,
    ) -> T:
        """Một request multimodal async với byte ảnh trong RAM và structured output."""
        if self.client is None or types is None:
            raise RuntimeError("Chưa cấu hình GEMINI_API_KEY hoặc google-genai.")
        parts = [types.Part.from_text(text=prompt)]
        parts.extend(types.Part.from_bytes(data=data, mime_type=mime_type) for data, mime_type in images)
        try:
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=self.model,
                    contents=[types.Content(role="user", parts=parts)],
                    config=types.GenerateContentConfig(
                        system_instruction=system,
                        response_mime_type="application/json",
                        response_schema=response_schema,
                    ),
                ),
                timeout=timeout_seconds,
            )
        except TimeoutError:
            raise
        except Exception as exc:
            _translate_provider_error(exc)
        if response.parsed is not None:
            return response_schema.model_validate(response.parsed)
        return response_schema.model_validate_json(response.text or "")

    async def async_complete(self, prompt: str, *, system: str | None = None, timeout_seconds: float = 15.0) -> str:
        """API async sinh văn bản tự do cho chat / request path."""
        if self.client is None or types is None:
            raise RuntimeError("Chưa cấu hình GEMINI_API_KEY hoặc google-genai.")
        try:
            config = types.GenerateContentConfig(system_instruction=system) if system else None
            response = await asyncio.wait_for(
                self.client.aio.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config,
                ),
                timeout=timeout_seconds,
            )
            return response.text or ""
        except TimeoutError:
            raise
        except Exception as exc:
            _translate_provider_error(exc)

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
