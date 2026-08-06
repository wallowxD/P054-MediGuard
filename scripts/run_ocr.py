"""CLI script to run Qwen3-VL Flash OCR Pipeline on PDF documents.

Usage:
    python scripts/run_ocr.py --pdf path/to/document.pdf
    python scripts/run_ocr.py --dir path/to/pdf_folder
"""

import argparse
import logging
import sys
from pathlib import Path

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from medsafe.ocr.pipeline import OCRPipeline

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="MedSafe OCR Pipeline Tool")
    parser.add_argument("--pdf", type=str, help="Path to single PDF file")
    parser.add_argument(
        "--dir", type=str, help="Directory containing PDF files to process in batch"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="output",
        help="Target output directory for .md files (default: output)",
    )
    parser.add_argument(
        "--dpi", type=int, default=300, help="Rendering DPI (default: 300)"
    )
    parser.add_argument(
        "--provider",
        type=str,
        choices=["qwen", "gemini"],
        default="gemini",
        help="OCR Provider model ('gemini' or 'qwen'). Default: gemini",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Override model name (e.g. 'gemini-3.6-flash', 'qwen3-vl-flash')",
    )
    parser.add_argument(
        "--no-skip",
        action="store_true",
        help="Force re-processing even if target .md file already exists",
    )
    parser.add_argument(
        "--proofread",
        action="store_true",
        help="Run Gemini Line-Diff Proofreader to fix typos in output Markdown",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=5,
        help="Number of concurrent worker threads for directory processing (default: 5).",
    )

    args = parser.parse_args()

    if not args.pdf and not args.dir:
        parser.error("Please provide either --pdf or --dir argument.")

    client = None
    if args.provider == "gemini":
        from medsafe.ocr.gemini_client import GeminiVLClient

        client = GeminiVLClient(model=args.model)
    elif args.provider == "qwen":
        from medsafe.ocr.qwen_client import QwenVLClient

        client = QwenVLClient(model=args.model)

    pipeline = OCRPipeline(
        output_dir=args.output_dir,
        dpi=args.dpi,
        client=client,
        provider=args.provider,
    )
    skip_existing = not args.force

    if args.pdf:
        pdf_path = Path(args.pdf)
        if not pdf_path.exists():
            logger.error(f"Specified PDF file does not exist: {pdf_path}")
            sys.exit(1)
        result = pipeline.process_pdf(
            pdf_path, skip_existing=skip_existing, proofread=args.proofread
        )
        print("\nProcessing complete!")
        print(f"File: {result.file_name}")
        print(f"Total Pages: {result.total_pages}")
        print(f"Transcribed Pages: {result.processed_pages}")
        print(f"Output saved to: {result.output_path}")

    elif args.dir:
        dir_path = Path(args.dir)
        if not dir_path.exists() or not dir_path.is_dir():
            logger.error(f"Specified directory does not exist: {dir_path}")
            sys.exit(1)

        pdf_files = list(dir_path.glob("*.pdf"))
        if not pdf_files:
            logger.warning(f"No PDF files found in {dir_path}")
            sys.exit(0)

        logger.info(f"Found {len(pdf_files)} PDF file(s) in {dir_path}")
        logger.info(f"Processing directory with {args.workers} worker threads...")

        def _process_file_task(pdf_file: Path):
            try:
                res = pipeline.process_pdf(
                    pdf_file, skip_existing=skip_existing, proofread=args.proofread
                )
                return (pdf_file.name, True, res.output_path)
            except Exception as e:
                logger.error(f"Failed to process {pdf_file.name}: {e}")
                return (pdf_file.name, False, str(e))

        from concurrent.futures import ThreadPoolExecutor, as_completed
        from tqdm import tqdm

        success_count = 0
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {
                executor.submit(_process_file_task, pdf_file): pdf_file
                for pdf_file in pdf_files
            }
            for future in tqdm(
                as_completed(futures), total=len(pdf_files), desc="OCR Directory", unit="file"
            ):
                fname, ok, out = future.result()
                if ok:
                    success_count += 1

        print("\nDirectory OCR Processing Complete!")
        print(f"Total Files: {len(pdf_files)} | Successful: {success_count}")


if __name__ == "__main__":
    main()
