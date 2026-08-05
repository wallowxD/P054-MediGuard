"""CLI cho pipeline ingestion — chạy tách khỏi web server.

Sử dụng:
    python -m medsafe.ingestion.cli --limit 10        # Chạy pilot 10 thuốc thử nghiệm
    python -m medsafe.ingestion.cli --limit 50        # Chạy pilot 50 thuốc theo PRD
    python -m medsafe.ingestion.cli --all             # Chạy toàn bộ 772 file HDSD
"""

import argparse
from pathlib import Path
import sys

# Thêm backend/src vào sys.path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from medsafe.ingestion.pipeline import run_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Trích xuất dữ liệu tương tác từ tờ HDSD (output_clean/*.md)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--limit", type=int, help="Chạy pilot N thuốc đầu")
    group.add_argument("--all", action="store_true", help="Chạy toàn bộ danh mục 772 file HDSD")
    parser.add_argument("--dry-run", action="store_true", help="Chạy thử nghiệm không nạp vào Supabase PostgreSQL")

    args = parser.parse_args()

    limit = None if args.all else args.limit
    run_pipeline(limit=limit, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
