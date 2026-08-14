"""Kiểm thử adapter Google GenAI multimodal mà không gọi provider thật."""

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from google.genai import errors as genai_errors
from pydantic import BaseModel

from medsafe.llm.llm_client import GeminiRateLimitError, GeminiUnavailableError, LLMClient


class ExampleOutput(BaseModel):
    name: str


@pytest.mark.asyncio
async def test_generate_structured_with_images_builds_inline_parts() -> None:
    generate_content = AsyncMock(return_value=SimpleNamespace(parsed={"name": "Cetimed"}, text=None))
    client = object.__new__(LLMClient)
    client.model = "gemini-3.5-flash-lite"
    client.client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content=generate_content)))

    result = await client.generate_structured_with_images(
        "Đọc ảnh",
        ExampleOutput,
        system="Chỉ trích xuất nội dung nhìn thấy",
        images=[(b"jpeg-bytes", "image/jpeg")],
        timeout_seconds=1,
    )

    assert result == ExampleOutput(name="Cetimed")
    request = generate_content.await_args.kwargs
    assert request["model"] == "gemini-3.5-flash-lite"
    assert len(request["contents"][0].parts) == 2
    assert request["contents"][0].parts[1].inline_data.mime_type == "image/jpeg"
    assert request["contents"][0].parts[1].inline_data.data == b"jpeg-bytes"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("provider_error", "expected_error"),
    [
        (genai_errors.ClientError(429, {"error": {"message": "quota"}}), GeminiRateLimitError),
        (genai_errors.ServerError(503, {"error": {"message": "high demand"}}), GeminiUnavailableError),
    ],
)
async def test_generate_structured_with_images_translates_transient_provider_errors(
    provider_error: Exception,
    expected_error: type[Exception],
) -> None:
    generate_content = AsyncMock(side_effect=provider_error)
    client = object.__new__(LLMClient)
    client.model = "gemini-3.5-flash-lite"
    client.client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content=generate_content)))

    with pytest.raises(expected_error):
        await client.generate_structured_with_images(
            "Đọc ảnh",
            ExampleOutput,
            system="Chỉ trích xuất nội dung nhìn thấy",
            images=[(b"jpeg-bytes", "image/jpeg")],
            timeout_seconds=1,
        )
