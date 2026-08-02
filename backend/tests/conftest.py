"""Fixture dùng chung.

Nguyên tắc: test trong `unit/` KHÔNG được gọi mạng, LLM hay DB thật.
Chỉ `integration/` mới được dùng app thật (vẫn mock LLM).
"""

from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from medsafe.main import app


@pytest_asyncio.fixture
async def client():
    """HTTP client bất đồng bộ để test endpoint."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_llm():
    """LLM giả — không gọi OpenAI trong test."""
    mock = AsyncMock()
    mock.complete.return_value = "Mocked LLM response"
    return mock


@pytest.fixture
def sample_catalog() -> list[tuple[str, str]]:
    """Vài dòng thật từ drug_list_bv_gtvt.csv, dạng (biệt dược, hoạt chất)."""
    return [
        ("SaVi Acarbose 50 mg [Acarbose]", "Acarbose"),
        ("Savi Acarbose 100 [100mg]", "Acarbose"),
    ]


@pytest.fixture
def sample_interaction() -> dict[str, str]:
    """Một bản ghi thật từ drugtodrug.json."""
    return {
        "ingredient_a": "Aceclofenac",
        "ingredient_b": "Ketorolac",
        "mechanism": "Hiệp đồng tác dụng kích ứng đường tiêu hóa",
        "consequence": "Tăng nguy cơ xuất huyết tiêu hóa nghiêm trọng",
        "management": "Chống chỉ định phối hợp.",
    }
