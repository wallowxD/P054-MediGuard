"""CLI script to verify PDF link activation in dataset/drug_list_bv_gtvt.csv and add the 'notes' column.

Usage:
    python scripts/check_dataset_links.py
    python scripts/check_dataset_links.py --csv path/to/custom_dataset.csv
"""

import argparse
import logging
import sys
from pathlib import Path

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from medsafe.services.dataset_service import update_dataset_link_notes


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(
        description="Verify drug PDF link activation and update dataset CSV notes column."
    )
    parser.add_argument(
        "--csv",
        type=str,
        default="dataset/drug_list_bv_gtvt.csv",
        help="Path to target CSV dataset file (default: dataset/drug_list_bv_gtvt.csv).",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to save updated CSV. Defaults to overwriting the input CSV.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=15,
        help="Number of concurrent thread workers for link checking (default: 15).",
    )

    args = parser.parse_args()
    csv_path = Path(args.csv)

    if not csv_path.exists():
        logger.error(f"Dataset CSV file not found: {csv_path}")
        sys.exit(1)

    try:
        saved_path = update_dataset_link_notes(
            csv_path=csv_path,
            output_path=args.output,
            max_workers=args.workers,
        )
        print(f"\nDataset link verification completed!")
        print(f"Updated dataset saved to: {saved_path}")

    except Exception as e:
        logger.error(f"Failed to update dataset links: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
