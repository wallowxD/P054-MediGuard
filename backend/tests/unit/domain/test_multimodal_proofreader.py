"""Unit tests cho MultimodalProofreader class."""

from medsafe.ocr.multimodal_proofreader import MultimodalProofreader


def test_parse_json_corrections_valid():
    raw_json = """```json
    [
        {"line": 2, "original": "Nortriptylin 10mg", "corrected": "Nortriptyline 10mg", "reason": "Lỗi chính tả tên hoạt chất"},
        {"line": 5, "original": "Liều dùng: 1-2 viên", "corrected": "Liều dùng: 1 - 2 viên/ngày", "reason": "Thiếu đơn vị ngày"}
    ]
    ```"""

    corrections = MultimodalProofreader._parse_json_corrections(raw_json)
    assert len(corrections) == 2
    assert corrections[0]["line"] == 2
    assert corrections[0]["corrected"] == "Nortriptyline 10mg"
    assert corrections[1]["line"] == 5


def test_parse_json_corrections_empty():
    raw_json = "[]"
    corrections = MultimodalProofreader._parse_json_corrections(raw_json)
    assert corrections == []


def test_parse_json_corrections_invalid():
    raw_json = "This is not json"
    corrections = MultimodalProofreader._parse_json_corrections(raw_json)
    assert corrections == []


def test_parse_json_corrections_truncated():
    raw_json = """[
        {"line": 2, "original": "Savi Valsartain", "corrected": "Savi Valsartan", "reason": "Typo"},
        {"line": 5, "original": "Bad text", "corrected": "Good text", "reason": "Unterminated string here..."""

    corrections = MultimodalProofreader._parse_json_corrections(raw_json)
    assert len(corrections) >= 1
    assert corrections[0]["line"] == 2
    assert corrections[0]["corrected"] == "Savi Valsartan"


def test_apply_corrections_exact():
    original_lines = [
        "# THÔNG TIN THUỐC",
        "Tên thuốc: Savi Valsartain Plus 80/12.5",
        "Hoạt chất: Valsartain 80mg",
        "Dạng bào chế: Viên nén",
    ]

    corrections = [
        {
            "line": 2,
            "original": "Tên thuốc: Savi Valsartain Plus 80/12.5",
            "corrected": "Tên thuốc: Savi Valsartan Plus 80/12.5",
            "reason": "Fix typo",
        },
        {
            "line": 3,
            "original": "Hoạt chất: Valsartain 80mg",
            "corrected": "Hoạt chất: Valsartan 80mg",
            "reason": "Fix typo",
        },
    ]

    result = MultimodalProofreader._apply_corrections(original_lines, corrections)
    lines_res = result.splitlines()

    assert lines_res[0] == "# THÔNG TIN THUỐC"
    assert lines_res[1] == "Tên thuốc: Savi Valsartan Plus 80/12.5"
    assert lines_res[2] == "Hoạt chất: Valsartan 80mg"
    assert lines_res[3] == "Dạng bào chế: Viên nén"


def test_apply_corrections_empty():
    original_lines = ["Line 1", "Line 2"]
    result = MultimodalProofreader._apply_corrections(original_lines, [])
    assert result == "Line 1\nLine 2"
