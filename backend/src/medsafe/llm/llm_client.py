"""Gọi LLM — một cửa duy nhất.

Mọi lời gọi model đi qua đây để: đổi provider một chỗ, log token/chi phí một chỗ,
và mock trong test một chỗ. Không gọi thẳng SDK OpenAI ở node/route.

temperature mặc định 0.0: đây là hệ tra cứu, không phải hệ sáng tác.
"""

from typing import Any


class LLMClient:
    def __init__(
        self,
        api_key: str,
        model: str,
        *,
        temperature: float = 0.0,
        max_tokens: int = 1500,
    ) -> None:
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    async def complete(self, prompt: str, *, system: str | None = None) -> str:
        """Sinh text thuần."""
        raise NotImplementedError

    async def complete_json(self, prompt: str, schema: dict[str, Any]) -> dict[str, Any]:
        """Sinh output có cấu trúc theo schema. Dùng cho bước trích xuất."""
        raise NotImplementedError

    async def complete_vision(
        self,
        prompt: str,
        image_bytes: bytes,
        *,
        schema: dict[str, Any] | None = None,
    ) -> dict[str, Any] | str:
        """Đọc ảnh — dùng cho quét đơn thuốc và trích xuất trang PDF HDSD."""
        raise NotImplementedError
