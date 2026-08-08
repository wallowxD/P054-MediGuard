"""Unit test cho `domain/catalog.py` — logic thuần, không DB, không network."""

from medsafe.domain.catalog import ALPHABET, NON_ALPHA_LETTER, bucket_for, build_letter_index


def test_bucket_for_alphabetic_names() -> None:
    assert bucket_for("acarbose") == "A"
    assert bucket_for("Acarbose") == "A"
    assert bucket_for("zoamco") == "Z"


def test_bucket_for_non_alphabetic_names() -> None:
    """Tên bắt đầu bằng số hoặc ký tự rơi vào nhóm `other`, không bị bỏ rơi."""
    assert bucket_for("3b-medi") == NON_ALPHA_LETTER
    assert bucket_for("[test]") == NON_ALPHA_LETTER
    assert bucket_for("") == NON_ALPHA_LETTER


def test_bucket_for_vietnamese_accented_first_char() -> None:
    """Chữ cái có dấu không thuộc A–Z nên vào `other`.

    Trên dữ liệu thật `brand_name_unaccent` đã bỏ dấu nên nhánh này không xảy ra, nhưng
    nó phải trả về nhóm hợp lệ thay vì ném lỗi nếu ingestion sót một dòng.
    """
    assert bucket_for("Ăn") == NON_ALPHA_LETTER


def test_build_letter_index_always_returns_all_groups() -> None:
    result = build_letter_index({"a": 3, "z": 1})

    assert len(result) == 27
    assert [item.letter for item in result[:26]] == list(ALPHABET)
    assert result[-1].letter == NON_ALPHA_LETTER

    counts = {item.letter: item.count for item in result}
    assert counts["A"] == 3
    assert counts["Z"] == 1
    assert counts["B"] == 0


def test_build_letter_index_merges_case_and_non_alpha() -> None:
    """Ký tự hoa/thường gộp chung một nhóm; mọi ký tự không phải chữ cái dồn vào `other`."""
    result = build_letter_index({"a": 2, "A": 1, "3": 5, "-": 2})

    counts = {item.letter: item.count for item in result}
    assert counts["A"] == 3
    assert counts[NON_ALPHA_LETTER] == 7


def test_build_letter_index_empty_catalog() -> None:
    result = build_letter_index({})

    assert len(result) == 27
    assert all(item.count == 0 for item in result)
