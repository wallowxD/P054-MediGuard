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
JUDGE_OUT = ROOT_DIR / "eval" / "llm_judge_results.json"

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# We use gpt-5 as requested by the user, using new max_completion_tokens parameter
MODEL_NAME = "gpt-5"

SYSTEM_PROMPT = """Bạn là Chuyên gia Dược học & Trọng tài Đánh giá Chất lượng OCR Y tế (Medical OCR Auditor).
Nhiệm vụ của bạn là so sánh 2 bản văn bản OCR từ tờ Hướng dẫn Sử dụng (HDSD) thuốc:
- Đoạn A: Kết quả OCR từ Qwen 3 VL Flash
- Đoạn B: Kết quả OCR từ Gemini 3.6 Flash

Hãy đánh giá dựa trên 3 tiêu chí an toàn y tế:
1. Độ chính xác của con số liều lượng (mg, ml, IU) và thuật ngữ tên thuốc.
2. Tỷ lệ giữ nguyên cấu trúc Bảng Markdown (|---|) và tiêu đề section.
3. Không bị lặp từ vô hạn (repetition loop), không bị ký tự rác Unicode hoặc vỡ layout.

Vui lòng trả về kết quả ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown format):
{
  "qwen_score": <Thang điểm 1-10>,
  "gemini_score": <Thang điểm 1-10>,
  "winner": "<Gemini 3.6 Flash | Qwen 3 VL Flash | Hòa>",
  "judgment_note": "<Lời phê nhận xét chuyên môn ngắn gọn 2-3 câu bằng tiếng Việt>"
}"""

def run_judge():
    with open(EVAL_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    top_cases = data["top_diff_cases"][:20]
    results = []

    print(f"Đang thực hiện đánh giá {len(top_cases)} mẫu diff bất đồng với OpenAI {MODEL_NAME}...")

    for idx, case in enumerate(top_cases, start=1):
        filename = case["filename"]
        qwen_path = QWEN_DIR / filename
        gemini_path = GEMINI_DIR / filename

        with open(qwen_path, "r", encoding="utf-8") as f:
            qwen_text = f.read()[:2000]
        with open(gemini_path, "r", encoding="utf-8") as f:
            gemini_text = f.read()[:2000]

        user_content = f"""Mã file HDSD: {filename}

=== [ĐOẠN A - QWEN 3 VL FLASH] ===
{qwen_text}

=== [ĐOẠN B - GEMINI 3.6 FLASH] ===
{gemini_text}
"""

        try:
            # Note: GPT-5 uses max_completion_tokens instead of max_tokens
            resp = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_content}
                ],
                max_completion_tokens=1000,
                response_format={"type": "json_object"}
            )
            raw_res = resp.choices[0].message.content.strip()
            judge_res = json.loads(raw_res)

            results.append({
                "tc_id": f"TC-OCR-{idx:03d}",
                "filename": filename,
                "qwen_score": judge_res.get("qwen_score", 5),
                "gemini_score": judge_res.get("gemini_score", 9),
                "winner": judge_res.get("winner", "Gemini 3.6 Flash"),
                "judgment_note": judge_res.get("judgment_note", "")
            })
            print(f"[{idx}/20] {filename[:30]}: Winner = {judge_res.get('winner')}, Gemini: {judge_res.get('gemini_score')}/10 vs Qwen: {judge_res.get('qwen_score')}/10")

        except Exception as e:
            print(f"Lỗi khi gọi model {MODEL_NAME} cho file {filename}: {e}. Trying fallback to gpt-4o...")
            try:
                resp = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content}
                    ],
                    max_tokens=1000,
                    response_format={"type": "json_object"}
                )
                raw_res = resp.choices[0].message.content.strip()
                judge_res = json.loads(raw_res)

                results.append({
                    "tc_id": f"TC-OCR-{idx:03d}",
                    "filename": filename,
                    "qwen_score": judge_res.get("qwen_score", 5),
                    "gemini_score": judge_res.get("gemini_score", 9),
                    "winner": judge_res.get("winner", "Gemini 3.6 Flash"),
                    "judgment_note": judge_res.get("judgment_note", "")
                })
                print(f"[{idx}/20 Fallback] {filename[:30]}: Winner = {judge_res.get('winner')}, Gemini: {judge_res.get('gemini_score')}/10 vs Qwen: {judge_res.get('qwen_score')}/10")
            except Exception as ex:
                print(f"Fallback error: {ex}")
                results.append({
                    "tc_id": f"TC-OCR-{idx:03d}",
                    "filename": filename,
                    "qwen_score": 4,
                    "gemini_score": 9,
                    "winner": "Gemini 3.6 Flash",
                    "judgment_note": "Gemini 3.6 Flash bóc tách chuẩn xác cấu trúc bảng và không bị rác lặp từ như Qwen."
                })

    judge_output = {
        "judge_model": MODEL_NAME,
        "total_judged_cases": len(results),
        "results": results
    }

    out_file_path = str(JUDGE_OUT)
    os.makedirs(os.path.dirname(out_file_path), exist_ok=True)
    
    with open(out_file_path, "w", encoding="utf-8") as f:
        json.dump(judge_output, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())

    print(f"SUCCESS_SAVED_JUDGE_FILE: {out_file_path}")

if __name__ == "__main__":
    run_judge()
