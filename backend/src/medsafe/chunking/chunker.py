"""Cắt văn bản tờ HDSD thành chunk để embed.

RÀNG BUỘC QUAN TRỌNG: chunk là thứ sẽ được hiển thị lại cho người dùng dưới dạng
"đoạn trích nguyên văn". Vì vậy:
- KHÔNG chuẩn hoá, viết hoa/thường lại, bỏ dấu, hay sửa chính tả nội dung chunk.
- Ưu tiên cắt theo ranh giới mục ("TƯƠNG TÁC THUỐC", "CHỐNG CHỈ ĐỊNH"...) trước khi
  cắt theo độ dài. Cắt giữa câu làm đoạn trích mất nghĩa và mất tính "nguyên văn".
- Mỗi chunk phải giữ được đường về nguồn: file PDF nào, trang nào, mục nào.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Chunk:
    """Một đoạn văn bản giữ nguyên văn kèm toạ độ nguồn."""

    text: str  # NGUYÊN VĂN, không chỉnh sửa
    drug_id: str
    source_url: str  # link HDSD gốc
    page: int | None
    section: str | None  # tên mục trong tờ HDSD
    char_start: int
    char_end: int


def chunk_document(
    text: str,
    *,
    drug_id: str,
    source_url: str,
    chunk_size: int = 800,
    chunk_overlap: int = 120,
    section_headers: list[str] | None = None,
) -> list[Chunk]:
    """Cắt một tờ HDSD thành các chunk có truy vết nguồn."""
    raise NotImplementedError


def split_by_sections(text: str, section_headers: list[str]) -> list[tuple[str, str]]:
    """Tách văn bản theo các tiêu đề mục. Trả về [(tên_mục, nội_dung)]."""
    raise NotImplementedError
