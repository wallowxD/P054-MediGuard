"""Gemini Batch API OCR Script for 50% Cost Discount.

Scans drug leaflet image directories in `dataset/hdsd_images`, packages images into a `.jsonl` request file,
and submits an asynchronous Batch Job (`client.batches.create`) to Google Gemini API.

Key features:
1. **50% Cost Discount**: Cuts both input and output token costs in half.
2. **Offline/Turn-off Safe**: Once submitted, job processes entirely on Google Cloud.
3. **Automatic Job Tracking**: Saves Batch Job ID to `tmp/latest_batch_job.json` so user can retrieve results anytime.

Usage:
    # Dry-run check (format 5 drug folders into JSONL without submitting):
    python scripts/run_gemini_batch_ocr.py --limit 5 --dry-run

    # Submit Batch Job for first 10 drug folders:
    python scripts/run_gemini_batch_ocr.py --limit 10

    # Submit Batch Job for all drug folders:
    python scripts/run_gemini_batch_ocr.py
"""

import argparse
import base64
import json
import logging
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from tqdm import tqdm

from medsafe.config import get_settings
from medsafe.prompts.ocr_prompts import GEMINI_MEDICAL_OCR_SYSTEM_PROMPT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("BatchOCR")

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def natural_sort_key(s: str) -> List:
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", str(s))]


def find_drug_image_folders(input_dir: Path) -> List[Tuple[Path, List[Path]]]:
    """Recursively discover all drug leaf directories containing image files."""
    results = []
    if not input_dir.exists():
        return results

    valid_exts = {".png", ".jpg", ".jpeg", ".webp"}
    for root, _, files in os.walk(input_dir):
        image_files = [
            Path(root) / f for f in files if Path(f).suffix.lower() in valid_exts
        ]
        if image_files:
            image_files.sort(key=lambda p: natural_sort_key(p.name))
            results.append((Path(root), image_files))

    results.sort(key=lambda item: natural_sort_key(item[0].name))
    return results


def format_page_to_jsonl_item(folder_name: str, page_index: int, image_path: Path) -> dict:
    """Format a single image page into a Gemini Batch Request Item."""
    image_bytes = image_path.read_bytes()
    ext = image_path.suffix.lower().lstrip(".")
    mime_type = "image/png" if ext == "png" else ("image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}")
    b64_str = base64.b64encode(image_bytes).decode("utf-8")

    custom_id = f"{folder_name}__page_{page_index:03d}"

    return {
        "custom_id": custom_id,
        "request": {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_str,
                            }
                        },
                        {
                            "text": "Hãy chuyển đổi trang ảnh này thành định dạng Markdown (.md) sạch và chuẩn xác theo đúng quy tắc."
                        }
                    ]
                }
            ],
            "system_instruction": {
                "parts": [
                    {
                        "text": GEMINI_MEDICAL_OCR_SYSTEM_PROMPT
                    }
                ]
            },
            "generation_config": {
                "temperature": 0.0
            }
        }
    }


def main():
    parser = argparse.ArgumentParser(description="Gemini Batch API OCR Submission Tool")
    parser.add_argument(
        "--dir",
        type=str,
        default="dataset/hdsd_images",
        help="Input root directory containing drug image subdirectories (default: dataset/hdsd_images)",
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default="output_clean_v3",
        help="Target output directory for Markdown files (default: output_clean_v3)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of drug folders to process (e.g. --limit 5)",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="gemini-3.6-flash",
        help="Model name for Batch API (default: gemini-3.6-flash)",


    )
    parser.add_argument(
        "--gcs-bucket",
        type=str,
        default=None,
        help="Google Cloud Storage Bucket name (e.g. my-batch-ocr-bucket) for Vertex AI Batch jobs",
    )
    parser.add_argument(
        "--api-key",
        type=str,
        default=None,
        help="Optional API key override",
    )
    parser.add_argument(
        "--use-vertex",
        action="store_true",
        help="Enable Vertex AI mode",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Scan dataset and build JSONL request file without submitting to API",
    )

    args = parser.parse_args()
    input_path = Path(args.dir)
    output_path = Path(args.out_dir)

    if not input_path.exists():
        logger.error(f"Input directory does not exist: {input_path}")
        sys.exit(1)

    drug_folders = find_drug_image_folders(input_path)
    if args.limit:
        drug_folders = drug_folders[: args.limit]

    total_folders = len(drug_folders)
    total_images = sum(len(imgs) for _, imgs in drug_folders)

    logger.info(f"Discovered {total_folders} drug folder(s) containing {total_images} image file(s).")

    if total_folders == 0:
        logger.warning("No drug image folders found. Exiting.")
        sys.exit(0)

    # Auto-cleanup old temporary .jsonl files in tmp/ to free up disk space
    tmp_dir = Path("tmp")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    for old_jsonl in tmp_dir.glob("batch_ocr_requests_*.jsonl"):
        try:
            old_jsonl.unlink()
        except Exception:
            pass

    jsonl_file = tmp_dir / f"batch_ocr_requests_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"

    logger.info(f"Building Batch JSONL requests file: {jsonl_file} ...")
    items_count = 0
    skipped_folders = 0

    force_mode = getattr(args, "force", False)

    with open(jsonl_file, "w", encoding="utf-8") as f_out:
        for folder_path, image_files in tqdm(drug_folders, desc="Formatting JSONL", unit="folder"):
            folder_name = folder_path.name
            target_md = output_path / f"{folder_name}.md"

            # Resume Check: Skip folder if output .md already exists and is non-empty
            if not force_mode and target_md.exists() and target_md.stat().st_size > 0:
                skipped_folders += 1
                continue

            for page_idx, img_path in enumerate(image_files, start=1):
                item = format_page_to_jsonl_item(folder_name, page_idx, img_path)
                f_out.write(json.dumps(item, ensure_ascii=False) + "\n")
                items_count += 1

    file_size_mb = jsonl_file.stat().st_size / (1024 * 1024) if jsonl_file.exists() else 0.0
    logger.info(f"Generated {items_count} JSONL items in {jsonl_file.name} ({file_size_mb:.2f} MB). Skipped existing folders: {skipped_folders}")


    if args.dry_run:
        print("\n" + "=" * 80)
        print("DRY-RUN BATCH OCR SUMMARY")
        print("=" * 80)
        print(f"Total Folders    : {total_folders}")
        print(f"Total Images     : {total_images}")
        print(f"JSONL File Path  : {jsonl_file.resolve()}")
        print(f"JSONL File Size  : {file_size_mb:.2f} MB")
        print("=" * 80)
        print("Dry-run complete. No batch job submitted.")
        return

    # Load authentication
    settings = get_settings()
    api_key = (
        args.api_key
        or getattr(settings, "vertex_api_key", "")
        or getattr(settings, "gemini_api_key", "")
        or settings.google_api_key
        or os.getenv("VERTEX_API_KEY")
        or os.getenv("GEMINI_API_KEY")
    )
    use_vertex = args.use_vertex or getattr(settings, "use_vertex_ai", False) or os.getenv("USE_VERTEX_AI", "").lower() in ("true", "1", "yes")

    if not api_key and not use_vertex:
        logger.error("No API Key or Vertex AI configuration found. Set GEMINI_API_KEY or VERTEX_API_KEY in .env.")
        sys.exit(1)

    gcs_bucket = args.gcs_bucket or os.getenv("GCS_BUCKET_NAME") or os.getenv("GCS_BUCKET")

    try:
        from google import genai
        from google.genai import types

        if gcs_bucket:
            # Clean bucket name if user passed gs:// prefix
            bucket_clean = gcs_bucket.replace("gs://", "").strip("/").split("/")[0]
            logger.info(f"Using GCS Bucket: gs://{bucket_clean} for Vertex AI Batch Job...")

            from google.cloud import storage
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_clean)

            gcs_input_path = f"batch_ocr_inputs/{jsonl_file.name}"
            blob = bucket.blob(gcs_input_path)
            logger.info(f"Uploading '{jsonl_file.name}' to gs://{bucket_clean}/{gcs_input_path} ...")
            blob.upload_from_filename(str(jsonl_file))
            logger.info(f"Upload complete! GCS URI: gs://{bucket_clean}/{gcs_input_path}")

            gcs_src = f"gs://{bucket_clean}/{gcs_input_path}"
            gcs_dest = f"gs://{bucket_clean}/batch_ocr_outputs/"

            client = genai.Client(vertexai=True, api_key=api_key)
            logger.info(f"Submitting Vertex AI Batch Job for model '{args.model}'...")
            batch_job = client.batches.create(
                model=args.model,
                src=gcs_src,
                config=types.CreateBatchJobConfig(
                    dest=gcs_dest
                )
            )
        else:
            logger.info(f"Attempting Direct Gemini FileService upload for '{jsonl_file.name}'...")
            client = genai.Client(vertexai=False, api_key=api_key)
            uploaded_file = client.files.upload(file=jsonl_file, config=types.UploadFileConfig(mime_type="text/plain"))
            logger.info(f"File uploaded successfully! File Name: {uploaded_file.name}")

            logger.info(f"Submitting Batch Job for model '{args.model}'...")
            batch_job = client.batches.create(
                model=args.model,
                src=uploaded_file.name,
            )

        job_id = batch_job.name
        job_info = {
            "job_id": job_id,
            "created_at": datetime.now().isoformat(),
            "model": args.model,
            "total_folders": total_folders,
            "total_images": total_images,
            "jsonl_file": str(jsonl_file.resolve()),
            "output_dir": str(output_path.resolve()),
            "gcs_bucket": bucket_clean if gcs_bucket else None,
            "state": str(batch_job.state),
        }

        status_file = tmp_dir / "latest_batch_job.json"
        status_file.write_text(json.dumps(job_info, indent=2, ensure_ascii=False), encoding="utf-8")

        print("\n" + "=" * 80)
        print("🎉 GEMINI BATCH OCR JOB SUBMITTED SUCCESSFULLY!")
        print("=" * 80)
        print(f"Batch Job ID     : {job_id}")
        print(f"Job State        : {batch_job.state}")
        print(f"Total Folders    : {total_folders}")
        print(f"Total Images     : {total_images}")
        if gcs_bucket:
            print(f"GCS Input URI    : gs://{bucket_clean}/{gcs_input_path}")
            print(f"GCS Output URI   : gs://{bucket_clean}/batch_ocr_outputs/")
        print(f"Status File Saved: {status_file.resolve()}")
        print("-" * 80)
        print("📌 BẠN HOÀN TOÀN CÓ THỂ TẮT MÁY TÍNH HÔM NAY!")
        print("Google đang tự động chạy OCR cho toàn bộ ảnh trên Cloud.")
        print("Bất cứ khi nào bật máy lại (sau vài chục phút hoặc 24h), chạy lệnh sau để nhận file:")
        print(f"   python scripts/download_batch_ocr.py")
        print("=" * 80 + "\n")

    except Exception as err:
        logger.error(f"Failed to submit Batch OCR Job to Google Cloud: {err}")
        raise err


if __name__ == "__main__":
    main()
