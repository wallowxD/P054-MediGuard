"""Test API cho `GET /api/v1/drugs/search` và `GET /api/v1/drugs`.

Search: khớp chính xác, không dấu, mơ hồ, confidence thấp, query rỗng.
Danh mục: lọc theo chữ cái, lọc chuỗi con, phân trang, và ràng buộc tham số.
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
async def test_search_drugs_blank_query(search_client):
    """Query chỉ có khoảng trắng -> trả danh sách rỗng."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q=%20%20")
        assert response.status_code == 200
        data = response.json()

        assert data["candidates"] == []
        assert data["requiresConfirmation"] is False


@pytest.mark.asyncio
async def test_search_drugs_single_letter_returns_prefix_matches(search_client):
    """Gõ MỘT ký tự đã phải ra gợi ý — đây là ô autocomplete, không phải nút submit.

    Regression: trước đây route chặn cứng query dưới 2 ký tự nên vần "H" (và mọi chữ cái
    khác) luôn trả rỗng.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/search?q=a")
        assert response.status_code == 200
        data = response.json()

        assert [c["brandName"] for c in data["candidates"]] == ["Aspirin 500mg"]
        assert data["requiresConfirmation"] is True


@pytest.mark.asyncio
async def test_search_drugs_prefix_beats_fuzzy_noise(search_client):
    """Tiền tố tên biệt dược xếp trên, và fuzzy không được nhét kết quả lạc đề vào."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        data = (await ac.get("/api/v1/drugs/search?q=Pan")).json()

        assert [c["brandName"] for c in data["candidates"]] == ["Panadol Extra 500mg", "Panadol Spring"]
        assert all(c["confidence"] >= 96.0 for c in data["candidates"])


# ── GET /api/v1/drugs — duyệt danh mục ───────────────────────────────────────


@pytest.fixture
def fake_browse_catalog():
    """Danh mục nhỏ nhưng đủ các trường hợp: chữ đầu là số, tên có dấu, thiếu leaflet."""
    return [
        Drug(
            id=uuid.uuid4(),
            brand_name="3B-Medi",
            brand_name_unaccent="3b-medi",
            ingredient_raw="Vitamin B1, B6, B12",
            canonical_ingredients=["vitamin b1"],
            dosage_form="Viên nang mềm",
            route="Uống",
            leaflet_url="https://example.test/3b-medi",
        ),
        Drug(
            id=uuid.uuid4(),
            brand_name="Acarbose SaVi 50mg",
            brand_name_unaccent="acarbose savi 50mg",
            ingredient_raw="Acarbose",
            canonical_ingredients=["acarbose"],
            leaflet_url="https://example.test/acarbose",
        ),
        Drug(
            id=uuid.uuid4(),
            brand_name="Aspirin 500mg",
            brand_name_unaccent="aspirin 500mg",
            ingredient_raw="Aspirin",
            canonical_ingredients=["aspirin"],
            leaflet_url=None,
        ),
        Drug(
            id=uuid.uuid4(),
            brand_name="Hoạt Huyết Dưỡng Não",
            brand_name_unaccent="hoat huyet duong nao",
            ingredient_raw="Cao Bạch quả, Cao Đinh lăng",
            canonical_ingredients=["ginkgo biloba"],
            leaflet_url="https://example.test/hhdn",
        ),
        Drug(
            id=uuid.uuid4(),
            brand_name="Panadol Extra 500mg",
            brand_name_unaccent="panadol extra 500mg",
            ingredient_raw="Paracetamol, Caffeine",
            canonical_ingredients=["paracetamol", "caffeine"],
            leaflet_url="https://example.test/panadol",
        ),
    ]


@pytest.fixture
def browse_client(fake_browse_catalog):
    fake_repo = FakeDrugRepository(fake_browse_catalog)
    app.dependency_overrides[get_drug_repository] = lambda: fake_repo
    yield
    app.dependency_overrides.pop(get_drug_repository, None)


@pytest.mark.asyncio
async def test_list_drugs_default_page_sorted(browse_client):
    """Không tham số -> trả toàn bộ danh mục, sắp theo tên đã bỏ dấu."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs")
        assert response.status_code == 200
        data = response.json()

        assert data["total"] == 5
        assert data["page"] == 1
        assert data["totalPages"] == 1
        assert data["letter"] is None
        assert data["query"] is None
        assert [item["brandName"] for item in data["items"]] == [
            "3B-Medi",
            "Acarbose SaVi 50mg",
            "Aspirin 500mg",
            "Hoạt Huyết Dưỡng Não",
            "Panadol Extra 500mg",
        ]


@pytest.mark.asyncio
async def test_list_drugs_item_shape(browse_client):
    """Mỗi dòng có đủ trường định danh; hasLeaflet phản ánh đúng việc có nguồn hay không."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?q=3B-Medi")
        data = response.json()
        item = data["items"][0]

        assert item["brandName"] == "3B-Medi"
        assert item["ingredient"] == "Vitamin B1, B6, B12"
        assert item["dosageForm"] == "Viên nang mềm"
        assert item["route"] == "Uống"
        assert item["hasLeaflet"] is True

        response = await ac.get("/api/v1/drugs?q=Aspirin")
        assert response.json()["items"][0]["hasLeaflet"] is False


@pytest.mark.asyncio
async def test_list_drugs_filter_by_letter(browse_client):
    """letter=A chỉ trả thuốc bắt đầu bằng A; chữ thường cũng cho kết quả như chữ hoa."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?letter=A")
        assert response.status_code == 200
        data = response.json()

        assert data["total"] == 2
        assert data["letter"] == "A"
        assert [item["brandName"] for item in data["items"]] == ["Acarbose SaVi 50mg", "Aspirin 500mg"]

        lowercase = await ac.get("/api/v1/drugs?letter=a")
        assert lowercase.json()["items"] == data["items"]
        assert lowercase.json()["letter"] == "A"


@pytest.mark.asyncio
async def test_list_drugs_letter_other_covers_non_alpha(browse_client):
    """letter=other gom tên không bắt đầu bằng chữ cái Latin ("3B-Medi")."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?letter=other")
        assert response.status_code == 200
        data = response.json()

        assert data["total"] == 1
        assert data["letter"] == "other"
        assert data["items"][0]["brandName"] == "3B-Medi"


@pytest.mark.asyncio
async def test_list_drugs_query_matches_unaccented_brand(browse_client):
    """Gõ không dấu vẫn tìm được tên biệt dược có dấu."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?q=duong nao")
        assert response.status_code == 200
        data = response.json()

        assert data["query"] == "duong nao"
        assert data["total"] == 1
        assert data["items"][0]["brandName"] == "Hoạt Huyết Dưỡng Não"


@pytest.mark.asyncio
async def test_list_drugs_query_matches_ingredient(browse_client):
    """Lọc chuỗi con cũng chạy trên hoạt chất, không chỉ tên biệt dược."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?q=caffeine")
        data = response.json()

        assert data["total"] == 1
        assert data["items"][0]["brandName"] == "Panadol Extra 500mg"


@pytest.mark.asyncio
async def test_list_drugs_query_is_deterministic_not_fuzzy(browse_client):
    """Sai chính tả KHÔNG được đoán ra kết quả — đây là duyệt danh mục, không phải search."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?q=panadl")
        data = response.json()

        assert data["total"] == 0
        assert data["items"] == []
        assert data["totalPages"] == 0


@pytest.mark.asyncio
async def test_list_drugs_query_wildcard_is_literal(browse_client):
    """Ký tự `%` do người dùng nhập phải được hiểu là ký tự thường, không phải wildcard."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?q=%25")  # %25 = "%"
        data = response.json()

        assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_drugs_pagination_slices_without_overlap(browse_client):
    """Hai trang liền nhau không lặp bản ghi và tổng số trang tính đúng."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        first = (await ac.get("/api/v1/drugs?pageSize=2&page=1")).json()
        second = (await ac.get("/api/v1/drugs?pageSize=2&page=2")).json()

        assert first["total"] == second["total"] == 5
        assert first["totalPages"] == 3
        assert first["pageSize"] == 2
        assert len(first["items"]) == 2
        assert len(second["items"]) == 2

        first_ids = {item["id"] for item in first["items"]}
        second_ids = {item["id"] for item in second["items"]}
        assert first_ids.isdisjoint(second_ids)


@pytest.mark.asyncio
async def test_list_drugs_page_beyond_range_returns_empty(browse_client):
    """Trang vượt quá phạm vi trả danh sách rỗng nhưng vẫn giữ đúng total."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs?pageSize=2&page=99")
        assert response.status_code == 200
        data = response.json()

        assert data["items"] == []
        assert data["total"] == 5
        assert data["totalPages"] == 3


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "query_string",
    [
        "letter=AB",  # nhiều hơn một ký tự
        "letter=1",  # số không phải nhóm hợp lệ, phải dùng "other"
        "page=0",
        "pageSize=0",
        "pageSize=101",
    ],
)
async def test_list_drugs_rejects_invalid_params(browse_client, query_string):
    """Tham số ngoài miền cho phép trả 422 thay vì âm thầm rơi về mặc định."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get(f"/api/v1/drugs?{query_string}")
        assert response.status_code == 422


# ── GET /api/v1/drugs/letters — chỉ mục A–Z ──────────────────────────────────


@pytest.mark.asyncio
async def test_letters_returns_full_alphabet_including_empty_groups(browse_client):
    """Luôn trả đủ 27 nhóm; nhóm rỗng có count = 0 để FE disable nút thay vì ẩn đi."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/drugs/letters")
        assert response.status_code == 200
        data = response.json()

        assert len(data["letters"]) == 27
        assert [item["letter"] for item in data["letters"]][:3] == ["A", "B", "C"]
        assert data["letters"][-1]["letter"] == "other"

        counts = {item["letter"]: item["count"] for item in data["letters"]}
        assert counts["A"] == 2  # Acarbose SaVi 50mg + Aspirin 500mg
        assert counts["H"] == 1  # Hoạt Huyết Dưỡng Não
        assert counts["P"] == 1
        assert counts["other"] == 1  # 3B-Medi
        assert counts["B"] == 0


@pytest.mark.asyncio
async def test_letters_total_matches_catalog_size(browse_client):
    """`total` của chỉ mục phải bằng đúng `total` của danh sách không lọc."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        letters = (await ac.get("/api/v1/drugs/letters")).json()
        listing = (await ac.get("/api/v1/drugs?pageSize=1")).json()

        assert letters["total"] == listing["total"] == 5
        assert sum(item["count"] for item in letters["letters"]) == 5


@pytest.mark.asyncio
async def test_letters_count_matches_list_filter(browse_client):
    """Mỗi count phải bằng đúng total khi lọc `/drugs?letter=` — hai endpoint không được lệch."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        letters = (await ac.get("/api/v1/drugs/letters")).json()

        for item in letters["letters"]:
            if item["count"] == 0:
                continue
            listing = (await ac.get(f"/api/v1/drugs?letter={item['letter']}&pageSize=1")).json()
            assert listing["total"] == item["count"], item["letter"]


@pytest.mark.asyncio
async def test_letters_on_empty_catalog():
    """Danh mục rỗng vẫn trả đủ 27 nhóm với count = 0, không phải mảng rỗng."""
    app.dependency_overrides[get_drug_repository] = lambda: FakeDrugRepository([])
    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            data = (await ac.get("/api/v1/drugs/letters")).json()

            assert data["total"] == 0
            assert len(data["letters"]) == 27
            assert all(item["count"] == 0 for item in data["letters"])
    finally:
        app.dependency_overrides.pop(get_drug_repository, None)
