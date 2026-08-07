"""Test API cho endpoint `GET /api/v1/drugs/search`.

Kiểm tra: khớp chính xác, không dấu, mơ hồ, confidence thấp, query rỗng.
"""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from unit.domain.test_repositories_unit import FakeDrugRepository

from medsafe.api.dependencies import get_drug_repository
from medsafe.db.models.drug import Drug
from medsafe.main import app


@pytest.fixture
def fake_drug_catalog():
    d1_id = uuid.uuid4()
    d2_id = uuid.uuid4()
    d3_id = uuid.uuid4()
    return [
        Drug(
            id=d1_id,
            brand_name="Panadol Extra 500mg",
            brand_name_unaccent="panadol extra 500mg",
            ingredient_raw="Paracetamol, Caffeine",
            canonical_ingredients=["paracetamol", "caffeine"],
        ),
        Drug(
            id=d2_id,
            brand_name="Panadol Spring",
            brand_name_unaccent="panadol spring",
            ingredient_raw="Paracetamol",
            canonical_ingredients=["paracetamol"],
        ),
        Drug(
            id=d3_id,
            brand_name="Aspirin 500mg",
            brand_name_unaccent="aspirin 500mg",
            ingredient_raw="Aspirin",
            canonical_ingredients=["aspirin"],
        ),
    ]


@pytest.fixture
def search_client(fake_drug_catalog):

    fake_repo = FakeDrugRepository(fake_drug_catalog)
    app.dependency_overrides[get_drug_repository] = lambda: fake_repo
    yield
    app.dependency_overrides.pop(get_drug_repository, None)


@pytest.mark.asyncio
async def test_search_drugs_exact_match(search_client):
    """Khớp chính xác tên biệt dược."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q=Panadol Extra 500mg")
        assert response.status_code == 200
        data = response.json()

        assert data["query"] == "Panadol Extra 500mg"
        assert len(data["candidates"]) >= 1
        assert data["candidates"][0]["brandName"] == "Panadol Extra 500mg"
        assert data["candidates"][0]["confidence"] == 100.0


@pytest.mark.asyncio
async def test_search_drugs_diacritics_unaccented(search_client):
    """Gõ không dấu vẫn ra đúng kết quả như có dấu ("panadol extra" -> "Panadol Extra 500mg")."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q=panadol extra")
        assert response.status_code == 200
        data = response.json()

        assert data["query"] == "panadol extra"
        assert len(data["candidates"]) >= 1
        assert "Panadol Extra" in data["candidates"][0]["brandName"]


@pytest.mark.asyncio
async def test_search_drugs_ambiguous_query(search_client):
    """Query mơ hồ ("panadol") khớp nhiều ứng viên sát điểm -> requiresConfirmation = True."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q=panadol")
        assert response.status_code == 200
        data = response.json()

        assert len(data["candidates"]) >= 2
        assert data["requiresConfirmation"] is True


@pytest.mark.asyncio
async def test_search_drugs_low_confidence(search_client):
    """Query không khớp thuốc nào vượt ngưỡng -> trả danh sách rỗng, không đoán bừa."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q=thuoc_khong_ton_tai_xyz123")
        assert response.status_code == 200
        data = response.json()

        assert data["candidates"] == []
        assert data["requiresConfirmation"] is False


@pytest.mark.asyncio
async def test_search_drugs_short_or_empty_query(search_client):
    """Query quá ngắn (<2 kí tự sau trim) -> trả danh sách rỗng."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q= a ")
        assert response.status_code == 200
        data = response.json()

        assert data["candidates"] == []
        assert data["requiresConfirmation"] is False
