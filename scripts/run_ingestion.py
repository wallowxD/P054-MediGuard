"""Runner script cho Ingestion Pipeline — Chỉ dùng Gemini API với cơ chế RESUME.

Sử dụng:
    python scripts/run_ingestion.py --limit 10    # Bóc tách 10 file chưa làm
    python scripts/run_ingestion.py --all         # Bóc tách toàn bộ file HDSD (tự nhảy qua các file đã làm)
    python scripts/run_ingestion.py --reset       # Xóa checkpoint và làm lại từ đầu
"""

import argparse
import sys
from pathlib import Path

# Thêm backend/src vào sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend" / "src"))

from medsafe.ingestion.pipeline import run_pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Trích xuất tương tác từ HDSD bằng Gemini API (kèm cơ chế Resume)")
    parser.add_argument("--limit", type=int, help="Số lượng file HDSD tối đa cần bóc tách trong lượt này")
    parser.add_argument("--all", action="store_true", help="Bóc tách tất cả các file HDSD còn lại")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử nghiệm không nạp DB")
    parser.add_argument("--reset", action="store_true", help="Xóa tiến độ checkpoint cũ và chạy lại từ đầu")
    args = parser.parse_args()

    limit = None if args.all else args.limit
    run_pipeline(limit=limit, dry_run=args.dry_run, reset_checkpoint=args.reset)
