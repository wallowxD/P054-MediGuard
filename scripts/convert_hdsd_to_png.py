"""Convert PDF leaflets in dataset/hdsd_raw into high-quality PNG images.

Usage:
    python scripts/convert_hdsd_to_png.py
    python scripts/convert_hdsd_to_png.py --dpi 300 --workers 12
    python scripts/convert_hdsd_to_png.py --limit 5
"""

import argparse
import json
import logging
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from tqdm import tqdm

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from medsafe.ocr.pdf_renderer import PDFRenderer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("convert_hdsd_to_png")


def main():
    parser = argparse.ArgumentParser(
        description="Convert HDSD PDF files into high-quality PNG images."
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default="dataset/hdsd_raw",
        help="Input directory containing raw PDF files (default: dataset/hdsd_raw).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="dataset/hdsd_images",
        help="Output directory for storing rendered PNG images (default: dataset/hdsd_images).",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=300,
        help="Rendering resolution in DPI (default: 300).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=12,
        help="Number of concurrent worker threads (default: 12).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of PDFs to process (useful for testing).",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-rendering of PDFs even if PNG files already exist.",
    )

    args = parser.parse_args()

    input_path = Path(args.input_dir)
    output_path = Path(args.output_dir)

    if not input_path.exists():
        logger.error(f"Input directory does not exist: {input_path}")
        sys.exit(1)

    pdf_files = sorted(list(input_path.glob("*.pdf")))
    if not pdf_files:
        logger.warning(f"No PDF files found in {input_path}")
        sys.exit(0)

    if args.limit and args.limit > 0:
        pdf_files = pdf_files[: args.limit]

    logger.info(f"Found {len(pdf_files)} PDF file(s) to process.")
    logger.info(f"Output directory: {output_path.resolve()}")
    logger.info(f"DPI: {args.dpi} | Worker Threads: {args.workers}")

    output_path.mkdir(parents=True, exist_ok=True)
    renderer = PDFRenderer(dpi=args.dpi)
    skip_existing = not args.force

    start_time = time.time()

    def process_single_pdf(pdf_file: Path):
        pdf_stem = pdf_file.stem
        target_subfolder = output_path / pdf_stem
        try:
            saved_paths = renderer.render_pdf_to_images(
                pdf_path=pdf_file,
                output_dir=target_subfolder,
                dpi=args.dpi,
                fmt="png",
                skip_existing=skip_existing,
            )
            return (pdf_file.name, True, len(saved_paths), None)
        except Exception as e:
            return (pdf_file.name, False, 0, str(e))

    success_count = 0
    fail_count = 0
    total_pages_rendered = 0
    errors = []
    manifest_data = {}

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {
            executor.submit(process_single_pdf, pdf_file): pdf_file
            for pdf_file in pdf_files
        }

        for future in tqdm(
            as_completed(futures),
            total=len(pdf_files),
            desc="Rendering PDFs to PNG",
            unit="file",
        ):
            fname, ok, page_cnt, err_msg = future.result()
            stem = Path(fname).stem
            if ok:
                success_count += 1
                total_pages_rendered += page_cnt
                manifest_data[stem] = {
                    "status": "ok",
                    "file_name": fname,
                    "pages": page_cnt,
                    "image_dir": str((output_path / stem).relative_to(output_path.parent)),
                }
            else:
                fail_count += 1
                errors.append({"file_name": fname, "error": err_msg})
                manifest_data[stem] = {
                    "status": "error",
                    "file_name": fname,
                    "error": err_msg,
                }

    elapsed_time = time.time() - start_time

    # Save manifest summary JSON
    manifest_file = output_path / "conversion_manifest.json"
    manifest_summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "dpi": args.dpi,
        "total_pdf_files": len(pdf_files),
        "successful_conversions": success_count,
        "failed_conversions": fail_count,
        "total_pages_rendered": total_pages_rendered,
        "elapsed_seconds": round(elapsed_time, 2),
        "items": manifest_data,
    }
    manifest_file.write_text(json.dumps(manifest_summary, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 60)
    print("PDF to PNG Conversion Complete!")
    print(f"Total PDFs Processed : {len(pdf_files)}")
    print(f"Successful           : {success_count}")
    print(f"Failed               : {fail_count}")
    print(f"Total Pages Rendered : {total_pages_rendered}")
    print(f"Total Time Taken     : {elapsed_time:.2f} seconds")
    print(f"Manifest Saved To    : {manifest_file}")
    print("=" * 60)

    if errors:
        logger.warning(f"{len(errors)} error(s) occurred during conversion:")
        for err in errors[:10]:
            logger.warning(f"  - {err['file_name']}: {err['error']}")
        if len(errors) > 10:
            logger.warning(f"  ... and {len(errors) - 10} more.")


if __name__ == "__main__":
    main()
