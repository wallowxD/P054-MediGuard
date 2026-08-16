"""Gemini Batch API OCR Result Downloader & Markdown Parser.

Checks the status of a submitted Gemini Batch OCR Job, downloads the output JSONL result file from Google Cloud,
and parses/merges the transcribed text into clean Markdown (.md) files per drug folder in `output_clean_v3/`.

Usage:
    # Check & download results for the latest submitted batch job:
    python scripts/download_batch_ocr.py

    # Check status only without downloading:
    python scripts/download_batch_ocr.py --status-only

    # Download results for a specific Job ID:
    python scripts/download_batch_ocr.py --job-id batches/123456789abc
"""

import argparse
import json
import logging
import os
import re
import sys
from pathlib import Path

# Add backend/src to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend" / "src"))

from medsafe.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("DownloadBatchOCR")

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


def clean_markdown_fences(text: str) -> str:
    """Strip markdown code fences if present."""
    if not text:
        return ""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:markdown|md)?\s*\n?", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    return cleaned.strip()


def parse_batch_results_jsonl(jsonl_content: str) -> dict[str, list[tuple[int, str]]]:
    """Parse JSONL output lines from Gemini Batch API into per-folder page text dictionaries.

    Returns:
        Dict mapping folder_name -> list of tuples: (page_number, page_markdown_text)
    """
    folder_pages: dict[str, list[tuple[int, str]]] = {}

    for line_idx, raw_line in enumerate(jsonl_content.splitlines(), start=1):
        if not raw_line.strip():
            continue

        try:
            item = json.loads(raw_line)
            custom_id = item.get("custom_id", "")
            if not custom_id or "__page_" not in custom_id:
                logger.warning(f"Line {line_idx}: Invalid custom_id '{custom_id}'. Skipping.")
                continue

            folder_name, page_str = custom_id.split("__page_", 1)
            try:
                page_num = int(page_str)
            except ValueError:
                page_num = line_idx

            # Extract response text
            response_data = item.get("response", {})
            candidates = response_data.get("candidates", [])
            page_text = ""

            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    page_text = parts[0].get("text", "")

            cleaned_text = clean_markdown_fences(page_text)

            if folder_name not in folder_pages:
                folder_pages[folder_name] = []

            folder_pages[folder_name].append((page_num, cleaned_text))

        except Exception as err:
            logger.error(f"Error parsing JSONL line {line_idx}: {err}")

    # Sort pages in each folder numerically
    for folder_name in folder_pages:
        folder_pages[folder_name].sort(key=lambda x: x[0])

    return folder_pages


def main():
    parser = argparse.ArgumentParser(description="Download & Parse Gemini Batch OCR Results")
    parser.add_argument(
        "--job-id",
        type=str,
        default=None,
        help="Batch Job ID (e.g. batches/123456789abc). Defaults to reading tmp/latest_batch_job.json",
    )
    parser.add_argument(
        "--out-dir",
        type=str,
        default=None,
        help="Output directory for .md files. Defaults to output_dir saved in job metadata or output_clean_v3",
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
        "--status-only",
        action="store_true",
        help="Only check and print job status without downloading results",
    )

    args = parser.parse_args()

    # Load job info from tmp/latest_batch_job.json if job-id not provided
    status_file = Path("tmp/latest_batch_job.json")
    job_info = {}
    if status_file.exists():
        try:
            job_info = json.loads(status_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    job_id = args.job_id or job_info.get("job_id")
    output_dir_str = args.out_dir or job_info.get("output_dir") or "output_clean_v3"
    output_path = Path(output_dir_str)

    if not job_id:
        logger.error("No Batch Job ID provided and no previous job found in tmp/latest_batch_job.json.")
        logger.error("Please run scripts/run_gemini_batch_ocr.py first or specify --job-id batches/xxxx")
        sys.exit(1)

    # Authentication
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
        logger.error("No API Key or Vertex AI configuration found.")
        sys.exit(1)

    try:
        from google import genai
        client = genai.Client(vertexai=False, api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize google.genai Client: {e}")
        sys.exit(1)


    logger.info(f"Checking status for Batch Job ID: '{job_id}' ...")
    batch_job = client.batches.get(name=job_id)
    state_str = str(batch_job.state)

    logger.info(f"Batch Job State: {state_str}")

    if args.status_only:
        print("\n" + "=" * 80)
        print("BATCH JOB STATUS SUMMARY")
        print("=" * 80)
        print(f"Job ID       : {job_id}")
        print(f"State        : {state_str}")
        print(f"Model        : {getattr(batch_job, 'model', 'N/A')}")
        print("=" * 80 + "\n")
        return

    # Check if job completed successfully
    is_completed = "SUCCEEDED" in state_str or "COMPLETED" in state_str or "JOB_STATE_SUCCEEDED" in state_str

    if not is_completed:
        print("\n" + "=" * 80)
        print("⏳ BATCH JOB IS STILL PROCESSING ON GOOGLE CLOUD")
        print("=" * 80)
        print(f"Job ID       : {job_id}")
        print(f"Current State: {state_str}")
        print("-" * 80)
        print("📌 Google vẫn đang xử lý các trang ảnh. Bạn có thể tắt máy và kiểm tra lại sau.")
        print("Khi job hoàn tất, hãy chạy lại lệnh:")
        print(f"   python scripts/download_batch_ocr.py --job-id {job_id}")
        print("=" * 80 + "\n")
        return

    logger.info("Batch Job completed! Downloading results from Google Cloud...")
    output_path.mkdir(parents=True, exist_ok=True)

    gcs_bucket = job_info.get("gcs_bucket") or os.getenv("GCS_BUCKET_NAME") or os.getenv("GCS_BUCKET")
    jsonl_content = ""

    if gcs_bucket:
        bucket_clean = gcs_bucket.replace("gs://", "").strip("/").split("/")[0]
        logger.info(f"Checking GCS Bucket 'gs://{bucket_clean}/batch_ocr_outputs/' for results...")
        from google.cloud import storage
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_clean)
        blobs = list(bucket.list_blobs(prefix="batch_ocr_outputs/"))

        jsonl_parts = []
        for blob in blobs:
            if blob.name.endswith(".jsonl") or "predictions" in blob.name:
                logger.info(f"Downloading GCS output blob: {blob.name} ...")
                jsonl_parts.append(blob.download_as_text(encoding="utf-8"))

        if jsonl_parts:
            jsonl_content = "\n".join(jsonl_parts)

    if not jsonl_content:
        if hasattr(batch_job, "output_file") and batch_job.output_file:
            file_name = batch_job.output_file.name
            logger.info(f"Downloading output file '{file_name}' via client.files.download...")
            bytes_data = client.files.download(name=file_name)
            jsonl_content = bytes_data.decode("utf-8")
        elif dest and hasattr(dest, "file_name"):
            logger.info(f"Downloading destination file '{dest.file_name}'...")
            bytes_data = client.files.download(name=dest.file_name)
            jsonl_content = bytes_data.decode("utf-8")
        else:
            # Fallback: check files listed by client
            logger.info("Attempting to locate batch output file from Google files...")
            try:
                files_list = list(client.files.list())
                for f in files_list:
                    if "output" in f.name.lower() or job_id in f.name:
                        bytes_data = client.files.download(name=f.name)
                        jsonl_content = bytes_data.decode("utf-8")
                        break
            except Exception as e:
                logger.warning(f"Could not list files: {e}")

    if not jsonl_content:
        logger.error("Could not retrieve JSONL result content from Google Cloud Batch Job.")
        sys.exit(1)

    # Parse and save per drug folder
    folder_pages = parse_batch_results_jsonl(jsonl_content)
    saved_count = 0

    for folder_name, pages in folder_pages.items():
        valid_texts = [text for _, text in pages if text.strip()]
        if not valid_texts:
            logger.info(f"Folder [{folder_name}] had no valid body pages (all packaging/filtered).")
            continue

        merged_md = "\n\n".join(valid_texts).strip()
        save_file = output_path / f"{folder_name}.md"
        save_file.write_text(merged_md, encoding="utf-8")
        saved_count += 1
        logger.info(f"Saved merged Markdown: {save_file.name} ({len(merged_md)} chars, {len(valid_texts)} pages)")

    print("\n" + "=" * 80)
    print("🎉 BATCH OCR RESULTS DOWNLOADED & SAVED SUCCESSFULLY!")
    print("=" * 80)
    print(f"Batch Job ID     : {job_id}")
    print(f"Total Folders    : {len(folder_pages)}")
    print(f"Files Saved      : {saved_count}")
    print(f"Target Output    : {output_path.resolve()}")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
