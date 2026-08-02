"""Tiện ích dùng chung.

Chỉ để hàm thật sự dùng ở nhiều nơi và không thuộc về domain nào. Logic nghiệp vụ
(chuẩn hoá tên thuốc, xếp severity, ghép cặp) thuộc `domain/`, không để lẫn vào đây —
`utils` phình to thành bãi rác là dấu hiệu logic đang đặt sai chỗ.
"""

from pathlib import Path


def strip_diacritics(text: str) -> str:
    """Bỏ dấu tiếng Việt. Dùng để đối chiếu CSV (không dấu) với JSON (có dấu).

    CHỈ dùng cho việc so khớp. Không bao giờ lưu bản đã bỏ dấu đè lên text gốc —
    đoạn trích hiển thị cho người dùng phải giữ nguyên văn.
    """
    raise NotImplementedError


def drive_url_to_direct_download(url: str) -> str | None:
    """Đổi link Google Drive dạng /file/d/<id>/view sang link tải trực tiếp.

    Link HDSD trong drug_list_bv_gtvt.csv ở dạng xem, không tải được trực tiếp.
    """
    raise NotImplementedError


def stable_chunk_id(drug_id: str, source_url: str, char_start: int, char_end: int) -> str:
    """Sinh id ổn định cho chunk, để chạy lại ingestion không tạo bản trùng."""
    raise NotImplementedError


def ensure_dir(path: Path) -> Path:
    """Tạo thư mục nếu chưa có, trả lại chính nó."""
    path.mkdir(parents=True, exist_ok=True)
    return path
