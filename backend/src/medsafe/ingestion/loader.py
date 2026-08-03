"""Nạp dữ liệu thô: danh mục thuốc (CSV) và tờ HDSD (PDF).

Bẫy dữ liệu của dự án này:
- `drug_list_bv_gtvt.csv` có **tên cột không dấu** ("Biet duoc", "Hoat chat - Ham luong").
- Tên hoạt chất trích từ PDF có thể khác về dấu, hoa/thường và ký hiệu hàm lượng.
=> Không so khớp chuỗi thô. Mọi đối chiếu đi qua domain/normalization.py.
"""

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RawDrug:
    """Một dòng trong danh mục thuốc bệnh viện."""

    brand_name: str  # "Biet duoc"
    active_ingredient: str  # "Hoat chat - Ham luong"
    dosage_form: str | None  # "Dang bao che"
    route: str | None  # "Duong dung"
    manufacturer: str | None
    hdsd_url: str | None  # "Link HDSD 1" — link Google Drive


def load_drug_list(csv_path: Path) -> list[RawDrug]:
    """Đọc danh mục thuốc bệnh viện (~1073 dòng)."""
    raise NotImplementedError


def fetch_hdsd_pdf(url: str, cache_dir: Path) -> Path | None:
    """Tải PDF HDSD về cache. Trả None nếu link hỏng/không truy cập được.

    Link trong CSV là Google Drive dạng /file/d/<id>/view — cần đổi sang link tải
    trực tiếp trước khi request.
    """
    raise NotImplementedError
