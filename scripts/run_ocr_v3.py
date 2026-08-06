"""Production-grade Medical OCR Script for HDSD Images (Output Clean v3).

Transcribes drug leaflet images from `dataset/hdsd_images` to clean Markdown files in `output_clean_v3`
using Google Gemini (e.g. Gemini 3.6 Flash / 2.5 Flash) via Vertex AI or Google AI Studio.

Usage:
    # Dry-run check (scan dataset structure):
    python scripts/run_ocr_v3.py --dry-run

    # Run OCR with API Key:
    python scripts/run_ocr_v3.py --api-key YOUR_API_KEY

    # Run with Vertex AI mode:
    python scripts/run_ocr_v3.py --api-key YOUR_API_KEY --use-vertex --project YOUR_GCP_PROJECT

    # Process first 5 drug folders for testing:
    python scripts/run_ocr_v3.py --api-key YOUR_API_KEY --limit 5
"""

import argparse
import logging
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import List, Tuple, Optional

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from tqdm import tqdm

from medsafe.config import get_settings
from medsafe.ocr.gemini_client import GeminiVLClient
from medsafe.prompts.ocr_prompts import GEMINI_MEDICAL_OCR_SYSTEM_PROMPT


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("OCR_v3")

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def natural_sort_key(s: str) -> List:
    """Sort strings containing numbers in natural order (page_1, page_2, page_10)."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", str(s))]


def find_drug_image_folders(input_dir: Path) -> List[Tuple[Path, List[Path]]]:
    """Recursively discover all drug leaf directories containing image files.

    Returns:
        Sorted list of tuples: (drug_folder_path, list_of_image_file_paths)
    """
    results = []
    for root, dirs, files in os.walk(input_dir):
        root_path = Path(root)
        image_files = [
            root_path / f
            for f in files
            if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp"))
        ]
        if image_files:
            # Sort image files in natural page order (page_001.png, page_002.png, ...)
            image_files.sort(key=lambda p: natural_sort_key(p.name))
            results.append((root_path, image_files))

    # Sort drug folders naturally by batch / folder name
    results.sort(key=lambda pair: natural_sort_key(str(pair[0])))
    return results


def process_single_drug_folder(
    drug_folder: Path,
    image_files: List[Path],
    output_dir: Path,
    client: GeminiVLClient,
    skip_existing: bool = True,
) -> Tuple[str, bool, str, int, int]:
    """Process all images in a single drug folder and save combined Markdown output.

    Returns:
        (folder_name, success_flag, message_or_output_path, valid_pages_count, total_pages_count)
    """
    folder_name = drug_folder.name
    output_file = output_dir / f"{folder_name}.md"

    if skip_existing and output_file.exists() and output_file.stat().st_size > 0:
        return (folder_name, True, f"Skipped existing: {output_file.name}", len(image_files), len(image_files))

    valid_page_markdowns = []
    total_images = len(image_files)

    for img_path in image_files:
        try:
            page_md = client.process_image_file(
                image_path=img_path,
                system_prompt=GEMINI_MEDICAL_OCR_SYSTEM_PROMPT,
            )
            # Rule 1 Check: Empty string means packaging/box/label page (filtered out)
            if page_md and page_md.strip():
                valid_page_markdowns.append(page_md.strip())
            else:
                logger.info(f"Page {img_path.name} in {folder_name} identified as packaging/label -> Filtered out.")
        except Exception as e:
            logger.error(f"Error processing {img_path} in {folder_name}: {e}")
            raise e

    if not valid_page_markdowns:
        logger.warning(f"All {total_images} pages in {folder_name} were filtered out (packaging/label images).")
        return (folder_name, True, f"All pages filtered (packaging/label)", 0, total_images)

    # Combine valid page Markdowns with double newlines
    combined_markdown = "\n\n".join(valid_page_markdowns) + "\n"

    # Write output Markdown file
    output_file.write_text(combined_markdown, encoding="utf-8")
    return (folder_name, True, str(output_file), len(valid_page_markdowns), total_images)


def main():
    parser = argparse.ArgumentParser(
        description="Production-grade Medical OCR Engine v3 for HDSD Images using Gemini Flash / Vertex AI."
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default="dataset/hdsd_images",
        help="Input dataset directory containing drug image folders (default: dataset/hdsd_images).",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="output_clean_v3",
        help="Output directory for clean Markdown files (default: output_clean_v3).",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="Gemini / Vertex API Key (or set GEMINI_API_KEY / VERTEX_API_KEY in .env).",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-3.6-flash",
        help="Gemini Flash model name (default: gemini-3.6-flash).",
    )
    parser.add_argument(
        "--use-vertex",
        action="store_true",
        help="Use Google Cloud Vertex AI API mode instead of Google AI Studio.",
    )
    parser.add_argument(
        "--project",
        type=str,
        default=None,
        help="GCP Project ID (required when using Vertex AI).",
    )
    parser.add_argument(
        "--location",
        type=str,
        default="us-central1",
        help="GCP Region Location for Vertex AI (default: us-central1).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=5,
        help="Number of concurrent worker threads for folder-level processing (default: 5).",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit processing to first N drug folders.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-processing of folders even if output Markdown file already exists.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform a dry-run dataset scan and output validation without making LLM API calls.",
    )

    args = parser.parse_args()

    input_path = Path(args.input_dir)
    output_path = Path(args.output_dir)

    if not input_path.exists():
        logger.error(f"Input directory does not exist: {input_path}")
        sys.exit(1)

    output_path.mkdir(parents=True, exist_ok=True)

    # Discover drug folders
    logger.info(f"Scanning input directory: {input_path} ...")
    drug_folders = find_drug_image_folders(input_path)

    if args.limit:
        drug_folders = drug_folders[: args.limit]

    total_folders = len(drug_folders)
    total_images = sum(len(imgs) for _, imgs in drug_folders)

    logger.info(f"Found {total_folders} drug folder(s) containing {total_images} image file(s).")

    if args.dry_run:
        print("\n" + "=" * 80)
        print("DRY-RUN DATASET STRUCTURE SUMMARY")
        print("=" * 80)
        print(f"Total Drug Folders : {total_folders}")
        print(f"Total Image Files  : {total_images}")
        print(f"Output Directory   : {output_path.resolve()}")
        print("-" * 80)
        print("First 10 Drug Folders:")
        for idx, (fpath, imgs) in enumerate(drug_folders[:10], start=1):
            print(f"  {idx:02d}. [{fpath.name}] -> {len(imgs)} pages ({', '.join(p.name for p in imgs[:3])}{'...' if len(imgs)>3 else ''})")
        print("=" * 80)
        print("Dry-run complete. No API calls were made.")
        return

    # Check Authentication (API Key or Vertex ADC)
    settings = get_settings()
    api_key = args.api_key or os.getenv("VERTEX_API_KEY") or os.getenv("GEMINI_API_KEY") or settings.gemini_api_key or settings.google_api_key
    use_vertex = args.use_vertex or os.getenv("USE_VERTEX_AI", "").lower() in ("true", "1", "yes")

    if not api_key and not use_vertex:
        logger.warning("No API key provided and Vertex AI mode is not active.")
        logger.warning("You can provide an API Key via --api-key or use Vertex AI ADC mode with --use-vertex --project YOUR_PROJECT")
        print("\n[NOTE] Script and pipeline are configured and ready!")
        print("To run OCR with API Key:")
        print(f"  python scripts/run_ocr_v3.py --api-key <YOUR_API_KEY> --model {args.model}")
        print("To run OCR with Vertex AI ADC (gcloud auth application-default login):")
        print(f"  python scripts/run_ocr_v3.py --use-vertex --project <YOUR_GCP_PROJECT_ID> --model {args.model}")
        sys.exit(0)

    # Initialize Gemini client
    client = GeminiVLClient(
        api_key=api_key,
        model=args.model,
        use_vertex=args.use_vertex,
        project=args.project,
        location=args.location,
    )

    skip_existing = not args.force
    success_count = 0
    skipped_count = 0
    failed_count = 0

    print("\n" + "=" * 80)
    print(f"Starting Production Medical OCR Engine v3")
    print(f"Model          : {client.model}")
    print(f"Mode           : {'Vertex AI' if client.use_vertex else 'Google AI Studio / Gemini API'}")
    print(f"Total Folders  : {total_folders}")
    print(f"Total Images   : {total_images}")
    print(f"Output Directory: {output_path.resolve()}")
    print("=" * 80 + "\n")

    def _worker_task(folder_info: Tuple[Path, List[Path]]):
        drug_folder, image_files = folder_info
        try:
            return process_single_drug_folder(
                drug_folder=drug_folder,
                image_files=image_files,
                output_dir=output_path,
                client=client,
                skip_existing=skip_existing,
            )
        except Exception as err:
            return (drug_folder.name, False, str(err), 0, len(image_files))

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(_worker_task, folder): folder for folder in drug_folders}

        for future in tqdm(as_completed(futures), total=total_folders, desc="OCR Folders", unit="folder"):
            folder_name, ok, msg, valid_pages, total_pages = future.result()
            if ok:
                if "Skipped existing" in msg:
                    skipped_count += 1
                else:
                    success_count += 1
            else:
                failed_count += 1
                logger.error(f"Failed [{folder_name}]: {msg}")

    print("\n" + "=" * 80)
    print("OCR PROCESSING COMPLETE!")
    print(f"Total Folders Processed : {total_folders}")
    print(f"Successfully Converted : {success_count}")
    print(f"Skipped (Already Done) : {skipped_count}")
    print(f"Failed                  : {failed_count}")
    print(f"Output saved in         : {output_path.resolve()}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
