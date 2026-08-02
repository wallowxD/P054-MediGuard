"""CLI cho pipeline ingestion — chạy tách khỏi web server.

python -m medsafe.ingestion.cli --limit 50        # pilot theo PRD
python -m medsafe.ingestion.cli --all             # toàn bộ 1073 thuốc
python -m medsafe.ingestion.cli --drug-id SAVI001 # chạy lại một thuốc
"""

import argparse


def main() -> None:
    parser = argparse.ArgumentParser(description="Trích xuất dữ liệu tương tác từ tờ HDSD")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--limit", type=int, help="Chạy pilot N thuốc đầu")
    group.add_argument("--all", action="store_true", help="Chạy toàn bộ danh mục")
    group.add_argument("--drug-id", type=str, help="Chạy lại đúng một thuốc")
    parser.add_argument("--dry-run", action="store_true", help="Không ghi vào DB/vector store")

    parser.parse_args()
    raise NotImplementedError


if __name__ == "__main__":
    main()
