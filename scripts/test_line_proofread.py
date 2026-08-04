import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import requests
from src.config import get_settings

def run_diff_proofread():
    settings = get_settings()
    key = settings.gemini_api_key or settings.google_api_key
    raw_text = Path("output/sample_hdsd.md").read_text(encoding="utf-8")
    lines = raw_text.splitlines()

    numbered_lines = [
        f"{i+1}: {line}"
        for i, line in enumerate(lines)
        if line.strip()
    ]
    numbered_text = "\n".join(numbered_lines)

    prompt = f"""Bạn là chuyên gia hiệu đính tài liệu Y Dược Việt Nam.
Dưới đây là {len(numbered_lines)} dòng văn bản được đánh số từ file Markdown trích xuất qua OCR.

NHIỆM VỤ:
- Kiểm tra chính tả Tiếng Việt và các lỗi gõ sai/ký tự dị do OCR.
- CHỈ trả về một JSON array chứa các dòng BỊ LỖI CHÍNH TẢ và câu đã sửa lại.
- KHÔNG bao gồm các dòng đã đúng. Nếu không có dòng nào sai, trả về [].

ĐỊNH DẠNG JSON MẪU:
[
  {{"line": 17, "corrected": "Câu đúng sau khi sửa"}}
]

Danh sách các dòng:
{numbered_text}"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }

    all_corrections = []
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=60)
        if r.status_code == 200:
            res = r.json()
            json_str = res["candidates"][0]["content"]["parts"][0]["text"]
            all_corrections = json.loads(json_str)
        else:
            print(f"Error: {r.text[:200]}")
    except Exception as e:
        print(f"Exception: {e}")

    print(f"Received total {len(all_corrections)} line corrections from Gemini:")
    updated_lines = list(lines)
    for c in all_corrections:
        idx = c["line"] - 1
        if 0 <= idx < len(updated_lines):
            updated_lines[idx] = c["corrected"]

    out_path = Path("output/sample_hdsd_line_proofread.md")
    out_path.write_text("\n".join(updated_lines), encoding="utf-8")
    print(f"Successfully saved updated file to {out_path}!")

if __name__ == "__main__":
    run_diff_proofread()
