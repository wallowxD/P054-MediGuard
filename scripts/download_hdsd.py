"""Tai file HDSD (huong dan su dung) tu Google Drive theo link trong drug_list_bv_gtvt.csv."""

from __future__ import annotations

import argparse
import csv
import re
import time
from dataclasses import dataclass
from pathlib import Path

import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

CSV_PATH = Path("dataset/drug_list_bv_gtvt.csv")
OUT_DIR = Path("dataset/hdsd_raw")
MANIFEST_PATH = OUT_DIR / "manifest.csv"
DRIVE_ID_RE = re.compile(r"/(?:file|document|presentation)/d/([a-zA-Z0-9_-]+)")
MAGIC_BYTES_EXT = [
    (b"%PDF", ".pdf"),
    (b"\xff\xd8\xff", ".jpg"),
    (b"\x89PNG\r\n\x1a\n", ".png"),
]


def sniff_extension(content: bytes) -> str | None:
    """Doan phan mo rong file dua tren magic bytes (Drive tra ve content-type chung chung)."""
    for magic, ext in MAGIC_BYTES_EXT:
        if content.startswith(magic):
            return ext
    return None


@dataclass
class DownloadResult:
    status: str
    http_status: int | None
    local_path: str
    file_size: int


def build_session() -> requests.Session:
    """Tao requests session co retry cho loi mang tam thoi."""
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1.0, status_forcelist=[429, 500, 502, 503, 504])
    session.mount("https://", HTTPAdapter(max_retries=retry))
    return session


def extract_file_id(url: str) -> str | None:
    """Lay Google Drive file id tu link dang /file/d/<id>/view."""
    match = DRIVE_ID_RE.search(url)
    return match.group(1) if match else None


def sanitize_filename(name: str) -> str:
    """Chuan hoa ten thuoc thanh chuoi an toan cho ten file."""
    cleaned = re.sub(r"[^\w\-]+", "_", name, flags=re.UNICODE).strip("_")
    return cleaned[:60] or "unknown"


def resolve_download_url(source_url: str, file_id: str) -> str:
    """Chon endpoint tai ve phu hop: Drive file blob hoac Google Docs/Slides export."""
    if "docs.google.com/document/d/" in source_url:
        return f"https://docs.google.com/document/d/{file_id}/export?format=pdf"
    if "docs.google.com/presentation/d/" in source_url:
        return f"https://docs.google.com/presentation/d/{file_id}/export/pdf"
    return f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"


def download_drive_file(session: requests.Session, source_url: str, file_id: str, dest_stem: Path) -> DownloadResult:
    """Tai 1 file Drive/Docs public (anyone-with-link) ve dest_stem + phan mo rong phu hop."""
    url = resolve_download_url(source_url, file_id)
    try:
        resp = session.get(url, timeout=30)
    except requests.RequestException as e:
        return DownloadResult(status=f"network_error:{e}", http_status=None, local_path="", file_size=0)

    ext = sniff_extension(resp.content) if resp.status_code == 200 else None
    if ext is None:
        content_type = resp.headers.get("content-type", "unknown").split(";")[0].strip()
        return DownloadResult(
            status=f"bad_response:{content_type}",
            http_status=resp.status_code,
            local_path="",
            file_size=0,
        )

    dest_path = dest_stem.with_suffix(ext)
    dest_path.write_bytes(resp.content)
    return DownloadResult(status="ok", http_status=resp.status_code, local_path=str(dest_path), file_size=len(resp.content))


def load_rows(csv_path: Path) -> list[dict[str, str]]:
    """Doc CSV danh muc thuoc, tra ve list dict theo header goc."""
    with csv_path.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def process_link(
    session: requests.Session, row_index: int, biet_duoc: str, link_slot: int, url: str
) -> dict[str, str]:
    """Xu ly 1 link (HDSD 1 hoac 2) cua 1 dong thuoc, tra ve 1 dong manifest."""
    record = {
        "row_index": row_index,
        "biet_duoc": biet_duoc,
        "link_slot": link_slot,
        "url": url,
        "file_id": "",
        "status": "",
        "http_status": "",
        "local_path": "",
        "file_size": 0,
    }
    file_id = extract_file_id(url)
    if not file_id:
        record["status"] = "no_file_id"
        return record

    stem = OUT_DIR / f"{row_index:04d}_{sanitize_filename(biet_duoc)}_{link_slot}_{file_id}"
    result = download_drive_file(session, url, file_id, stem)
    record.update(
        file_id=file_id,
        status=result.status,
        http_status=result.http_status,
        local_path=result.local_path,
        file_size=result.file_size,
    )
    return record


def run(limit: int | None, delay: float) -> list[dict[str, str]]:
    """Chay toan bo pipeline tai ve, tra ve danh sach manifest records."""
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = load_rows(CSV_PATH)
    if limit:
        rows = rows[:limit]

    session = build_session()
    manifest: list[dict[str, str]] = []
    for row_index, row in enumerate(rows, start=1):
        biet_duoc = row.get("Biet duoc", "").strip()
        for slot, col in ((1, "Link HDSD 1"), (2, "Link 2")):
            url = (row.get(col) or "").strip()
            if not url:
                continue
            manifest.append(process_link(session, row_index, biet_duoc, slot, url))
            time.sleep(delay)
    return manifest


def write_manifest(manifest: list[dict[str, str]]) -> None:
    """Ghi ket qua tai ve ra file manifest.csv de doi chieu."""
    if not manifest:
        return
    with MANIFEST_PATH.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(manifest[0].keys()))
        writer.writeheader()
        writer.writerows(manifest)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None, help="Chi xu ly N dong dau (pilot run)")
    parser.add_argument("--delay", type=float, default=0.3, help="Delay (giay) giua cac request")
    args = parser.parse_args()

    manifest = run(limit=args.limit, delay=args.delay)
    write_manifest(manifest)

    ok = sum(1 for r in manifest if r["status"] == "ok")
    print(f"Tong link: {len(manifest)} | Thanh cong: {ok} | That bai: {len(manifest) - ok}")
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
