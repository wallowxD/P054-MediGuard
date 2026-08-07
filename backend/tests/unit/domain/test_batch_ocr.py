"""Unit tests cho các hàm xử lý dữ liệu Batch API OCR.

Đảm bảo logic format JSONL request item và logic parse/gộp trang từ file output JSONL hoạt động chính xác.
"""

import json
from pathlib import Path

from medsafe.prompts.ocr_prompts import GEMINI_MEDICAL_OCR_SYSTEM_PROMPT
from scripts.download_batch_ocr import clean_markdown_fences, parse_batch_results_jsonl
from scripts.run_gemini_batch_ocr import format_page_to_jsonl_item


def test_clean_markdown_fences():
    raw_md = "```markdown\n# TỜ HƯỚNG DẪN SỬ DỤNG THUỐC\n\nNội dung...\n```"
    cleaned = clean_markdown_fences(raw_md)
    assert cleaned.startswith("# TỜ HƯỚNG DẪN")
    assert not cleaned.endswith("```")


def test_format_page_to_jsonl_item(tmp_path: Path):
    sample_img = tmp_path / "page_001.png"
    sample_img.write_bytes(b"\x89PNG\r\n\x1a\nfake_image_bytes")

    folder_name = "0001_SaVi_Acarbose_50"
    item = format_page_to_jsonl_item(folder_name, 1, sample_img)

    assert item["custom_id"] == "0001_SaVi_Acarbose_50__page_001"
    assert "request" in item
    assert item["request"]["system_instruction"]["parts"][0]["text"] == GEMINI_MEDICAL_OCR_SYSTEM_PROMPT


def test_parse_batch_results_jsonl():
    jsonl_str = (
        json.dumps({
            "custom_id": "0001_SaVi__page_002",
            "response": {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Trang 2 nội dung"}]
                        }
                    }
                ]
            }
        }) + "\n" +
        json.dumps({
            "custom_id": "0001_SaVi__page_001",
            "response": {
                "candidates": [
                    {
                        "content": {
                            "parts": [{"text": "Trang 1 nội dung"}]
                        }
                    }
                ]
            }
        }) + "\n"
    )

    folder_pages = parse_batch_results_jsonl(jsonl_str)

    assert "0001_SaVi" in folder_pages
    pages = folder_pages["0001_SaVi"]
    assert len(pages) == 2
    # Phải được sắp xếp theo trang (trang 1 trước, trang 2 sau)
    assert pages[0][0] == 1
    assert pages[0][1] == "Trang 1 nội dung"
    assert pages[1][0] == 2
    assert pages[1][1] == "Trang 2 nội dung"
