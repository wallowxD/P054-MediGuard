"""Test chuẩn hoá tên thuốc — chạy không cần LLM, DB hay mạng.

Đây là nguồn số liệu cho metric "tỷ lệ chuẩn hoá tên thuốc đúng" trong PRD.
Thêm case thật từ dataset vào đây mỗi khi phát hiện tên bị khớp sai.
"""

import pytest

from medsafe.domain.normalization import extract_ingredient_from_brand, match_drug


@pytest.mark.parametrize(
    ("brand", "expected"),
    [
        ("SaVi Acarbose 50 mg [Acarbose]", "Acarbose"),
        ("Savi Acarbose 100 [100mg]", "Acarbose"),
    ],
)
@pytest.mark.skip(reason="chưa implement extract_ingredient_from_brand")
def test_extract_ingredient_from_brand(brand: str, expected: str) -> None:
    assert extract_ingredient_from_brand(brand) == expected


@pytest.mark.skip(reason="chưa implement match_drug")
def test_match_drug_khong_dau_van_khop(sample_catalog: list[tuple[str, str]]) -> None:
    """CSV không dấu vẫn phải khớp được với input có dấu."""
    result = match_drug("acarbose", sample_catalog)
    assert result.active_ingredient == "Acarbose"


@pytest.mark.skip(reason="chưa implement match_drug")
def test_match_drug_duoi_nguong_thi_tra_none(sample_catalog: list[tuple[str, str]]) -> None:
    """Không khớp được thì trả None, KHÔNG đoán bừa — chọn nhầm thuốc nguy hiểm hơn."""
    result = match_drug("xyz-khong-ton-tai", sample_catalog)
    assert result.active_ingredient is None
