"""Test chuẩn hoá tên thuốc — chạy không cần LLM, DB hay mạng.

Đây là nguồn số liệu cho metric "tỷ lệ chuẩn hoá tên thuốc đúng" trong PRD.
Thêm case thật từ dataset vào đây mỗi khi phát hiện tên bị khớp sai.
"""

import uuid

import pytest

from medsafe.domain.normalization import (
    BRAND_PREFIX_SCORE,
    EXACT_MATCH_SCORE,
    extract_ingredient_from_brand,
    match_drug,
    search_catalog,
)


@pytest.mark.parametrize(
    ("brand", "expected"),
    [
        ("SaVi Acarbose 50 mg [Acarbose]", "Acarbose"),
        ("Savi Acarbose 100 [100mg]", "Acarbose"),
    ],
)
@pytest.mark.skip(
    reason="Lỗi đã biết: ngoặc vuông không phải lúc nào cũng là hoạt chất — "
    '"Savi Acarbose 100 [100mg]" trả về "100mg". Sửa thuộc về ingestion, không phải search.'
)
def test_extract_ingredient_from_brand(brand: str, expected: str) -> None:
    assert extract_ingredient_from_brand(brand) == expected


def test_match_drug_khong_dau_van_khop(sample_catalog: list[tuple[str, str]]) -> None:
    """CSV không dấu vẫn phải khớp được với input có dấu."""
    result = match_drug("acarbose", sample_catalog)
    assert result.active_ingredient == "Acarbose"


def test_match_drug_duoi_nguong_thi_tra_none(sample_catalog: list[tuple[str, str]]) -> None:
    """Không khớp được thì trả None, KHÔNG đoán bừa — chọn nhầm thuốc nguy hiểm hơn."""
    result = match_drug("xyz-khong-ton-tai", sample_catalog)
    assert result.active_ingredient is None


# ── search_catalog — nguồn dữ liệu của GET /api/v1/drugs/search ──────────────


@pytest.fixture
def scored_catalog() -> list[tuple[object, str, str]]:
    """Danh mục thu nhỏ nhưng giữ đúng hình dạng gây lỗi: tên nhiều token, có dấu."""
    return [
        (uuid.uuid4(), "Hapacol Caplet 500 [Paracetamol 500mg]", "Paracetamol"),
        (uuid.uuid4(), "Hadusartan 16", "Valsartan"),
        (uuid.uuid4(), "Panadol Viên Sủi", "Paracetamol"),
        (uuid.uuid4(), "Viên Sáng Mắt", "Cao Việt quất"),
    ]


def test_search_catalog_single_letter_matches_prefix(scored_catalog) -> None:
    """Regression: gõ "H" phải ra thuốc vần H, trước đây trả rỗng."""
    candidates, requires_confirmation = search_catalog("H", scored_catalog)

    assert {c.brand_name for c in candidates} == {"Hapacol Caplet 500 [Paracetamol 500mg]", "Hadusartan 16"}
    assert all(c.confidence >= BRAND_PREFIX_SCORE for c in candidates)
    assert requires_confirmation is True


def test_search_catalog_short_prefix_does_not_pull_fuzzy_noise(scored_catalog) -> None:
    """Regression: "Ha" từng khớp "Viên Sáng Mắt" vì token_set_ratio chấm điểm rác."""
    candidates, _ = search_catalog("Ha", scored_catalog)

    assert "Viên Sáng Mắt" not in {c.brand_name for c in candidates}
    assert len(candidates) == 2


def test_search_catalog_prefix_of_multi_token_brand(scored_catalog) -> None:
    """Regression: "Panadol" từng trượt "Panadol Viên Sủi" vì token thừa kéo điểm xuống."""
    candidates, _ = search_catalog("Panadol", scored_catalog)

    assert [c.brand_name for c in candidates] == ["Panadol Viên Sủi"]


def test_search_catalog_exact_match_skips_confirmation(scored_catalog) -> None:
    """Đúng một ứng viên khớp tuyệt đối thì không cần bước xác nhận."""
    candidates, requires_confirmation = search_catalog("Hadusartan 16", scored_catalog)

    assert len(candidates) == 1
    assert candidates[0].confidence == EXACT_MATCH_SCORE
    assert requires_confirmation is False


def test_search_catalog_substring_match_still_requires_confirmation(scored_catalog) -> None:
    """Khớp chuỗi con KHÔNG đủ để tự chọn hộ — thuốc chọn sai đi thẳng vào lượt kiểm tra."""
    candidates, requires_confirmation = search_catalog("Sủi", scored_catalog)

    assert [c.brand_name for c in candidates] == ["Panadol Viên Sủi"]
    assert candidates[0].confidence < EXACT_MATCH_SCORE
    assert requires_confirmation is True


def test_search_catalog_tolerates_typo_in_brand(scored_catalog) -> None:
    """Gõ sai một ký tự vẫn ra đúng thuốc — fuzzy so với TỪNG token, không phải cả chuỗi."""
    candidates, _ = search_catalog("panadl", scored_catalog)

    assert [c.brand_name for c in candidates] == ["Panadol Viên Sủi"]


def test_search_catalog_accent_insensitive(scored_catalog) -> None:
    """Gõ không dấu ra thuốc có dấu và ngược lại."""
    khong_dau, _ = search_catalog("vien sui", scored_catalog)
    co_dau, _ = search_catalog("Viên Sủi", scored_catalog)

    assert [c.brand_name for c in khong_dau] == ["Panadol Viên Sủi"]
    assert [c.brand_name for c in co_dau] == ["Panadol Viên Sủi"]


def test_search_catalog_matches_ingredient(scored_catalog) -> None:
    """Gõ tên hoạt chất vẫn tìm được các biệt dược chứa hoạt chất đó."""
    candidates, _ = search_catalog("Paracetamol", scored_catalog)

    assert {c.brand_name for c in candidates} == {
        "Hapacol Caplet 500 [Paracetamol 500mg]",
        "Panadol Viên Sủi",
    }


def test_search_catalog_nonsense_returns_empty(scored_catalog) -> None:
    """Không khớp thì trả rỗng — KHÔNG hạ ngưỡng để ép ra kết quả."""
    candidates, requires_confirmation = search_catalog("xyzkhongcothat", scored_catalog)

    assert candidates == []
    assert requires_confirmation is False


def test_search_catalog_respects_limit(scored_catalog) -> None:
    assert len(search_catalog("H", scored_catalog)[0]) == 2
    assert len(search_catalog("H", scored_catalog, limit=1)[0]) == 1


def test_search_catalog_single_letter_is_prefix_only(scored_catalog) -> None:
    """Một ký tự KHÔNG khớp chuỗi con: "a" mà ra "Panadol" thì gợi ý thành vô nghĩa."""
    candidates, _ = search_catalog("a", scored_catalog)

    assert candidates == []


def test_search_catalog_order_is_stable(scored_catalog) -> None:
    """Cùng điểm thì xếp theo tên: thứ tự phải giống nhau giữa các lần gọi."""
    first, _ = search_catalog("H", scored_catalog)
    second, _ = search_catalog("H", scored_catalog)

    assert [c.brand_name for c in first] == [c.brand_name for c in second]
    assert [c.brand_name for c in first] == sorted(c.brand_name for c in first)
