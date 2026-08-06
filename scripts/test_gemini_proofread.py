import json
import logging
import sys
from pathlib import Path

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

import requests
from medsafe.config import get_settings


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger(__name__)

sys.stdout.reconfigure(encoding="utf-8")

def test_proofread():
    settings = get_settings()
    api_key = settings.gemini_api_key or settings.google_api_key
    if not api_key:
        logger.error("No Gemini API key found in .env")
        sys.exit(1)

    target_file = Path("output/0001_SaVi_Acarbose_50_mg_Acarbose_1_1zeM4uSTKOGNfMvw0JSQJ-v01fl6_GPMu.md")
    if not target_file.exists():
        logger.error(f"File not found: {target_file}")
        sys.exit(1)

    raw_text = target_file.read_text(encoding="utf-8")
    lines = raw_text.splitlines()

    numbered_lines = [
        f"{i+1}: {line}"
        for i, line in enumerate(lines)
        if line.strip()
    ]

    numbered_text = "\n".join(numbered_lines)

    prompt = f"""Bạn là chuyên gia hiệu đính tài liệu Y Dược Việt Nam.

NHIỆM VỤ:
- Chỉ phát hiện lỗi chính tả và lỗi OCR.
- Chỉ sửa khi chắc chắn.
- Không viết lại câu.
- Không thay đổi văn phong.
- Không thay đổi Markdown.
- Không gộp hoặc tách dòng.
- Không sửa các lỗi khoảng trắng trước dấu câu (ví dụ " :") hoặc đổi kiểu chữ hoa/thường nếu không làm sai nghĩa.
- Không sửa tên thuốc, hoạt chất, tá dược, đơn vị, số đăng ký, địa chỉ, tên công ty... trừ khi chắc chắn là lỗi OCR.

OUTPUT:
Chỉ trả về JSON Array hợp lệ.
Nếu không có lỗi: []

Mỗi object trong JSON Array:
{{
  "line": <int>,
  "original": "<nội_dung_gốc>",
  "corrected": "<nội_dung_đã_sửa>",
  "reason": "<lý_do_sửa>"
}}

DANH SÁCH CÁC DÒNG VĂN BẢN (dạng `số_dòng: nội_dung`):
{numbered_text}"""

    model = "gemini-2.5-flash-lite"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1
        },
    }

    logger.info(f"Sending proofread request to {model} for {target_file.name} ({len(lines)} lines)...")
    response = requests.post(url, json=payload, headers=headers, timeout=90)

    if response.status_code != 200:
        logger.error(f"API Error ({response.status_code}): {response.text}")
        sys.exit(1)

    result = response.json()
    json_text = result["candidates"][0]["content"]["parts"][0]["text"]
    corrections = json.loads(json_text)

    print("\n" + "="*80)
    print(f"RESULTS FROM {model} ON {target_file.name}:")
    print(f"Total corrections identified: {len(corrections)}")
    print("="*80)

    updated_lines = list(lines)
    for idx, item in enumerate(corrections, 1):
        line_num = item.get("line")
        original = item.get("original", "")
        corrected = item.get("corrected", "")
        reason = item.get("reason", "")
        print(f"\n[{idx}] Line {line_num}:")
        print(f"   Original:  {original or lines[line_num-1]}")
        print(f"   Corrected: {corrected}")
        print(f"   Reason:    {reason}")

        if line_num and 1 <= line_num <= len(updated_lines):
            updated_lines[line_num - 1] = corrected

    output_test_file = Path("output/0001_SaVi_Acarbose_50_mg_Acarbose_proofread_test.md")
    output_test_file.write_text("\n".join(updated_lines), encoding="utf-8")
    print("\n" + "="*80)
    print(f"Proofread file saved to: {output_test_file.resolve()}")
    print("="*80)

if __name__ == "__main__":
    test_proofread()
