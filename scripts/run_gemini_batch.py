"""Gemini Batch API Script for 50% Cost Discount.

Prepares bulk JSONL requests for Markdown proofreading and submits asynchronous Batch Jobs
to Google Gemini Batch API (`client.batches.create`) for 50% price reduction.

Usage:
    python scripts/run_gemini_batch.py --limit 10
    python scripts/run_gemini_batch.py --dir output/ --model gemini-2.5-flash-lite
"""

import argparse
import json
import logging
import sys
import tempfile
import time
from pathlib import Path

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from google import genai
from google.genai import types
from medsafe.config import get_settings


logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)

sys.stdout.reconfigure(encoding="utf-8")

PROMPT_TEMPLATE = """Bạn là chuyên gia hiệu đính tài liệu Y Dược Việt Nam.

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
Chỉ trả về một JSON Array hợp lệ.
Nếu không có lỗi: []

Mỗi object trong JSON Array:
{{
  "line": <số_dòng_kiểu_int>,
  "corrected": "<nội_dung_đã_sửa>"
}}

DANH SÁCH CÁC DÒNG VĂN BẢN (dạng `số_dòng: nội_dung`):
{numbered_text}"""


def create_batch_request_item(md_path: Path, model_name: str) -> dict:
    """Format a single markdown file into a Gemini Batch Request Item."""
    raw_content = md_path.read_text(encoding="utf-8")
    lines = raw_content.splitlines()
    numbered_lines = [f"{i+1}: {line}" for i, line in enumerate(lines) if line.strip()]
    numbered_text = "\n".join(numbered_lines)

    prompt = PROMPT_TEMPLATE.format(numbered_text=numbered_text)

    return {
        "contents": [{"parts": [{"text": prompt}], "role": "user"}],
        "config": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        },
    }


def main():
    parser = argparse.ArgumentParser(description="Submit Gemini Batch API Jobs for 50% discount.")
    parser.add_argument("--dir", type=str, default="output", help="Input directory (default: output/).")
    parser.add_argument("--model", type=str, default="gemini-2.5-flash-lite", help="Model name.")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of files to process.")
    args = parser.parse_args()

    settings = get_settings()
    api_key = settings.gemini_api_key or settings.google_api_key
    if not api_key:
        logger.error("No Gemini API key found in settings or environment!")
        sys.exit(1)

    in_dir = Path(args.dir)
    md_files = [
        f for f in sorted(in_dir.glob("*.md"))
        if not f.name.startswith("sample_") and not f.name.endswith("_proofread_test.md")
    ]

    if args.limit:
        md_files = md_files[: args.limit]

    if not md_files:
        logger.warning("No Markdown files found to process.")
        sys.exit(0)

    logger.info(f"Preparing Gemini Batch Requests for {len(md_files)} files using model {args.model}...")

    # Build inline requests list
    inline_requests = [create_batch_request_item(f, args.model) for f in md_files]

    client = genai.Client(api_key=api_key)

    logger.info(f"Submitting Batch Job to Gemini API (50% Discount Mode)...")
    try:
        job = client.batches.create(
            model=args.model,
            src=inline_requests,
            config={"display_name": f"proofread_batch_{len(md_files)}_files"}
        )
        logger.info(f"Batch Job Created Successfully!")
        logger.info(f"Job Name: {job.name}")
        logger.info(f"Current State: {job.state}")
        print("\n" + "="*80)
        print(f"Gemini Batch Job Submitted! (50% Discount Applied)")
        print(f"Job Name: {job.name}")
        print(f"Total Files in Batch: {len(md_files)}")
        print("="*80)

    except Exception as e:
        logger.error(f"Failed to create Gemini Batch Job: {e}")
        print("\nLƯU Ý VỀ BATCH API:")
        print("Gemini Batch API (giảm giá 50%) yêu cầu tài khoản Google AI Studio / GCP đã kích hoạt Billing (Pay-as-you-go).")
        print("Nếu bạn dùng tài khoản Free Tier, Google sẽ yêu cầu liên kết thẻ/Billing để dùng tính năng Batch Asynchronous.")


if __name__ == "__main__":
    main()
