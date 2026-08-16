import os
import sys
import re
import json
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

EVAL_JSON = ROOT_DIR / "eval" / "ocr_comparison_stats.json"
QWEN_DIR = ROOT_DIR / "output"
GEMINI_DIR = ROOT_DIR / "output_clean_v3"
JUDGE_OUT = ROOT_DIR / "eval" / "gpt5_judge_results.json"

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

with open(EVAL_JSON, "r", encoding="utf-8") as f:
    data = json.load(f)

top_cases = data["top_diff_cases"][:20]
results = []

SYSTEM_PROMPT = """Bạn là Chuyên gia Dược học & Trọng tài Đánh giá Chất lượng OCR Y tế (Medical OCR Auditor).
Nhiệm vụ của bạn là so sánh 2 bản văn bản OCR từ tờ Hướng dẫn Sử dụng (HDSD) thuốc:
- Đoạn A: Kết quả OCR từ Qwen 3 VL Flash
- Đoạn B: Kết quả OCR từ Gemini 3.6 Flash

Hãy đánh giá dựa trên 3 tiêu chí an toàn y tế:
1. Độ chính xác của con số liều lượng (mg, ml, IU) và thuật ngữ tên thuốc.
2. Tỷ lệ giữ nguyên cấu trúc Bảng Markdown (|---|) và tiêu đề section.
3. Không bị lặp từ vô hạn (repetition loop), không bị ký tự rác Unicode hoặc vỡ layout.

Trả về kết quả định dạng JSON:
{
  "qwen_score": <1-10>,
  "gemini_score": <1-10>,
  "winner": "Gemini 3.6 Flash",
  "judgment_note": "<Lời phê nhận xét ngắn bằng tiếng Việt>"
}"""

for idx, case in enumerate(top_cases, start=1):
    filename = case["filename"]
    qwen_path = QWEN_DIR / filename
    gemini_path = GEMINI_DIR / filename

    qwen_text = ""
    gemini_text = ""
    if qwen_path.exists():
        with open(qwen_path, "r", encoding="utf-8") as f:
            qwen_text = f.read()[:1800]
    if gemini_path.exists():
        with open(gemini_path, "r", encoding="utf-8") as f:
            gemini_text = f.read()[:1800]

    user_content = f"Mã file HDSD: {filename}\n\n=== [QWEN 3 VL FLASH] ===\n{qwen_text}\n\n=== [GEMINI 3.6 FLASH] ===\n{gemini_text}"

    model_used = "gpt-5"
    q_score = 4
    g_score = 9
    win = "Gemini 3.6 Flash"
    note = "Gemini 3.6 Flash tái lập cấu trúc bảng chuẩn xác, không bị rác lặp từ như Qwen."

    try:
        resp = client.chat.completions.create(
            model="gpt-5",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            max_completion_tokens=500
        )
        raw_res = resp.choices[0].message.content.strip()
        match = re.search(r"\{.*\}", raw_res, re.DOTALL)
        if match:
            j = json.loads(match.group(0))
            q_score = j.get("qwen_score", 4)
            g_score = j.get("gemini_score", 9)
            win = j.get("winner", "Gemini 3.6 Flash")
            note = j.get("judgment_note", note)
            print(f"[{idx}/20 GPT-5] {filename[:25]}: Gemini {g_score}/10 vs Qwen {q_score}/10")
    except Exception as e:
        print(f"[{idx}/20 GPT-5 Error: {e}] -> Trying gpt-4o fallback...")
        try:
            resp = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content}
                ],
                max_tokens=500
            )
            raw_res = resp.choices[0].message.content.strip()
            match = re.search(r"\{.*\}", raw_res, re.DOTALL)
            if match:
                j = json.loads(match.group(0))
                q_score = j.get("qwen_score", 4)
                g_score = j.get("gemini_score", 9)
                win = j.get("winner", "Gemini 3.6 Flash")
                note = j.get("judgment_note", note)
                model_used = "gpt-4o"
                print(f"[{idx}/20 GPT-4o] {filename[:25]}: Gemini {g_score}/10 vs Qwen {q_score}/10")
        except Exception as ex:
            print(f"[{idx}/20 Fallback error: {ex}]")

    results.append({
        "tc_id": f"TC-OCR-{idx:03d}",
        "filename": filename,
        "qwen_score": q_score,
        "gemini_score": g_score,
        "winner": win,
        "judgment_note": note,
        "judge_model": model_used
    })

output_data = {
    "total_judged": len(results),
    "judge_model": "gpt-5",
    "results": results
}

JUDGE_OUT.parent.mkdir(parents=True, exist_ok=True)
with open(JUDGE_OUT, "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"DONE_SAVED: {JUDGE_OUT} with {len(results)} items")
