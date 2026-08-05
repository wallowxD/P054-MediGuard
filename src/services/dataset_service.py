"""Dataset service for checking link availability and updating dataset CSV files."""

import csv
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, Tuple

import requests
from tqdm import tqdm

logger = logging.getLogger(__name__)


def check_url_active(url: str, timeout: float = 5.0) -> bool:
    """Check if a URL is active and accessible via HTTP GET request.

    Args:
        url: Target URL string.
        timeout: Request timeout in seconds. Default is 5.0s.

    Returns:
        True if URL returns status code < 400, False otherwise.
    """
    if not url or not isinstance(url, str):
        return False
    url = url.strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        return False

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        return response.status_code < 400
    except requests.RequestException:
        return False


def _evaluate_row_links(row: Dict[str, str], timeout: float = 5.0) -> Tuple[int, str]:
    """Evaluate Link HDSD 1 and Link 2 for a single CSV row.

    Args:
        row: CSV row dictionary.
        timeout: Request timeout.

    Returns:
        Tuple of (row_index, status_note).
    """
    link1 = row.get("Link HDSD 1", "").strip()
    link2 = row.get("Link 2", "").strip()

    active1 = check_url_active(link1, timeout=timeout) if link1 else False
    active2 = check_url_active(link2, timeout=timeout) if link2 else False

    if active1 and active2:
        note = "Link 1: Active | Link 2: Active"
    elif active1:
        note = "Link 1: Active"
    elif active2:
        note = "Link 2: Active"
    elif link1 or link2:
        note = "Inactive"
    else:
        note = "No link"

    return note


def update_dataset_link_notes(
    csv_path: str | Path,
    output_path: str | Path | None = None,
    max_workers: int = 15,
    timeout: float = 5.0,
) -> Path:
    """Read dataset CSV, check link activation for all entries, add/update 'notes' column.

    Args:
        csv_path: Path to input dataset CSV file.
        output_path: Optional path to save updated CSV. Defaults to overwriting csv_path.
        max_workers: Number of parallel thread workers for link checking. Default 15.
        timeout: Timeout per URL request in seconds. Default 5.0s.

    Returns:
        Path to the saved CSV file.
    """
    csv_path = Path(csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset CSV file not found: {csv_path}")

    target_path = Path(output_path) if output_path else csv_path

    # Read CSV
    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames) if reader.fieldnames else []
        rows = list(reader)

    # Ensure 'notes' column exists in fieldnames
    if "notes" not in fieldnames:
        fieldnames.append("notes")

    logger.info(f"Checking link activation for {len(rows)} rows in {csv_path.name}...")

    # Process in parallel
    notes_results = ["" for _ in range(len(rows))]

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_idx = {
            executor.submit(_evaluate_row_links, row, timeout): idx
            for idx, row in enumerate(rows)
        }

        for future in tqdm(
            as_completed(future_to_idx),
            total=len(rows),
            desc="Verifying drug PDF links",
        ):
            idx = future_to_idx[future]
            try:
                note = future.result()
                notes_results[idx] = note
            except Exception as e:
                logger.error(f"Error checking row {idx}: {e}")
                notes_results[idx] = "Error checking link"

    # Attach notes to rows
    for idx, row in enumerate(rows):
        row["notes"] = notes_results[idx]

    # Write back to CSV
    with open(target_path, mode="w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    logger.info(f"Successfully updated dataset CSV saved to: {target_path}")
    return target_path
