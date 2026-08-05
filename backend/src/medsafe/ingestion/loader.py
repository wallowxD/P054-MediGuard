"""Nạp dữ liệu thô: danh mục thuốc (CSV) và tờ HDSD (PDF/Manifest/output_clean)."""

import csv
from dataclasses import dataclass
from pathlib import Path
import re
from typing import Dict, List, Set

from medsafe.domain.normalization import extract_ingredient_from_brand, normalize_for_matching


@dataclass(frozen=True)
class RawDrug:
    """Một dòng trong danh mục thuốc bệnh viện."""

    row_index: int
    brand_name: str  # "Biet duoc"
    active_ingredient_raw: str  # "Hoat chat - Ham luong"
    canonical_ingredient: str  # Hoạt chất đã chuẩn hóa sạch
    dosage_form: str | None  # "Dang bao che"
    route: str | None  # "Duong dung"
    manufacturer: str | None  # "Hang san xuat"
    hdsd_url: str | None  # "Link HDSD 1"
    hdsd_url_2: str | None  # "Link 2"
    insurance_payment_pct: str | None  # "% Thanh toan"
    indication_limits: str | None  # "Gioi han chi dinh"
    notes: str | None  # "notes"
    has_valid_hdsd: bool = True  # Trạng thái link HDSD hoạt động


def load_manifest_ok_file_ids(manifest_path: Path) -> Set[str]:
    """Đọc manifest.csv và trả về tập hợp các file_id có status='ok'."""
    ok_file_ids = set()
    if not manifest_path.exists():
        return ok_file_ids

    with open(manifest_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("status", "").strip() == "ok":
                file_id = row.get("file_id", "").strip()
                if file_id:
                    ok_file_ids.add(file_id)
    return ok_file_ids


def load_drug_list(
    csv_path: Path,
    manifest_path: Path | None = None,
    only_with_hdsd: bool = True,
) -> List[RawDrug]:
    """Đọc danh mục thuốc bệnh viện (~1074 dòng).

    Nếu `only_with_hdsd=True`, sẽ lọc giữ lại các thuốc có file HDSD đã OCR thành công (status='ok' trong manifest.csv).
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"Không tìm thấy file CSV tại: {csv_path}")

    ok_file_ids = set()
    if manifest_path and manifest_path.exists():
        ok_file_ids = load_manifest_ok_file_ids(manifest_path)

    drugs: List[RawDrug] = []

    with open(csv_path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=1):
            brand_name = row.get("Biet duoc", "").strip()
            ingredient_raw = row.get("Hoat chat - Ham luong", "").strip()

            if not brand_name and not ingredient_raw:
                continue

            link1 = row.get("Link HDSD 1", "").strip()
            link2 = row.get("Link 2", "").strip()

            # Trích file_id từ Google Drive Links
            drive_id_1 = re.search(r"/d/([a-zA-Z0-9_-]+)", link1).group(1) if re.search(r"/d/([a-zA-Z0-9_-]+)", link1) else ""
            drive_id_2 = re.search(r"/d/([a-zA-Z0-9_-]+)", link2).group(1) if re.search(r"/d/([a-zA-Z0-9_-]+)", link2) else ""

            # Kiểm tra xem có file_id nào nằm trong tập status='ok' của manifest không
            has_ok_link = False
            if ok_file_ids:
                has_ok_link = (drive_id_1 in ok_file_ids) or (drive_id_2 in ok_file_ids)
            else:
                has_ok_link = bool(drive_id_1 or drive_id_2)

            if only_with_hdsd and not has_ok_link:
                continue

            # Rút gọn canonical ingredient
            extracted = extract_ingredient_from_brand(brand_name)
            canonical = normalize_for_matching(extracted or ingredient_raw)

            drug = RawDrug(
                row_index=idx,
                brand_name=brand_name,
                active_ingredient_raw=ingredient_raw,
                canonical_ingredient=canonical,
                dosage_form=row.get("Dang bao che", "").strip() or None,
                route=row.get("Duong dung", "").strip() or None,
                manufacturer=row.get("Hang san xuat", "").strip() or None,
                hdsd_url=link1 or None,
                hdsd_url_2=link2 or None,
                insurance_payment_pct=row.get("% Thanh toan", "").strip() or None,
                indication_limits=row.get("Gioi han chi dinh", "").strip() or None,
                notes=row.get("notes", "").strip() or None,
                has_valid_hdsd=has_ok_link,
            )
            drugs.append(drug)

    return drugs
