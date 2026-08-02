"""Nạp dữ liệu thô: danh mục thuốc (CSV), cặp tương tác (JSON), tờ HDSD (PDF).

Bẫy dữ liệu của dự án này:
- `drug_list_bv_gtvt.csv` có **tên cột không dấu** ("Biet duoc", "Hoat chat - Ham luong").
- `drugtodrug.json` có **nội dung tiếng Việt có dấu** ("Hoạt chất 1", "Cơ chế").
=> Không so khớp chuỗi thô giữa hai nguồn. Mọi đối chiếu đi qua domain/normalization.py.
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


@dataclass(frozen=True)
class RawInteraction:
    """Một cặp tương tác đã biết, lấy từ drugtodrug.json."""

    ingredient_a: str  # "Hoạt chất 1"
    ingredient_b: str  # "Hoạt chất 2"
    mechanism: str  # "Cơ chế"
    consequence: str  # "Hậu quả"
    management: str  # "Xử trí"


def load_drug_list(csv_path: Path) -> list[RawDrug]:
    """Đọc danh mục thuốc bệnh viện (~1073 dòng)."""
    raise NotImplementedError


def load_known_interactions(json_path: Path) -> list[RawInteraction]:
    """Đọc các cặp tương tác đã có sẵn.

    Đây là dữ liệu **có cấu trúc, đã được thẩm định** — nguồn sự thật hạng nhất cho
    cảnh báo. Không đưa qua vector search để quyết định có tương tác hay không.
    """
    raise NotImplementedError


def fetch_hdsd_pdf(url: str, cache_dir: Path) -> Path | None:
    """Tải PDF HDSD về cache. Trả None nếu link hỏng/không truy cập được.

    Link trong CSV là Google Drive dạng /file/d/<id>/view — cần đổi sang link tải
    trực tiếp trước khi request.
    """
    raise NotImplementedError
