"""Cắt văn bản tờ HDSD thành chunk để embed.

RÀNG BUỘC QUAN TRỌNG: chunk là thứ sẽ được hiển thị lại cho người dùng dưới dạng "đoạn trích nguyên văn".
- KHÔNG chuẩn hoá, viết hoa/thường lại, bỏ dấu, hay sửa chính tả nội dung chunk.
- Ưu tiên cắt theo ranh giới mục ("TƯƠNG TÁC THUỐC", "CHỐNG CHỈ ĐỊNH"...) trước khi cắt theo độ dài.
- Mỗi chunk phải giữ được đường về nguồn: file PDF/URL nào, mục nào, vị trí char.
"""

import re
from dataclasses import dataclass

DEFAULT_SECTION_HEADERS = [
    "THÀNH PHẦN",
    "DẠNG BÀO CHẾ",
    "CHỈ ĐỊNH",
    "LIỀU LƯỢNG VÀ CÁCH DÙNG",
    "LIỀU DÙNG VÀ CÁCH DÙNG",
    "CÁCH DÙNG",
    "CHỐNG CHỈ ĐỊNH",
    "CẢNH BÁO VÀ THẬN TRỌNG",
    "THẬN TRỌNG",
    "TƯƠNG TÁC THUỐC",
    "TƯƠNG TÁC, TƯƠNG KỊ CỦA THUỐC",
    "TƯƠNG TÁC VỚI CÁC THUỐC KHÁC VÀ CÁC LOẠI TƯƠNG TÁC KHÁC",
    "TƯƠNG TÁC",
    "TÁC DỤNG KHÔNG MONG MUỐN",
    "TÁC DỤNG PHỤ",
    "QUÁ LIỀU",
    "DƯỢC LỰC HỌC",
    "DƯỢC ĐỘNG HỌC",
    "BẢO QUẢN",
    "HẠN DÙNG",
]


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


def split_by_sections(
    text: str,
    section_headers: list[str] | None = None,
) -> list[tuple[str, str]]:
    """Tách văn bản theo các tiêu đề mục. Trả về [(tên_mục, nội_dung)]."""
    if not text:
        return []

    headers = section_headers or DEFAULT_SECTION_HEADERS
    # Sắp xếp headers theo độ dài giảm dần để ưu tiên tiêu đề dài hơn
    sorted_headers = sorted(headers, key=len, reverse=True)

    # Tạo regex pattern nhận biết các tiêu đề mục (đầu dòng, sau Markdown header #, ##, ###, hoặc **TEXT**)
    pattern_parts = []
    for h in sorted_headers:
        escaped = re.escape(h)
        pattern_parts.append(rf"(?:\n|^)\s*(?:#+\s*|\*\*\s*|\d+\.\s*)?({escaped})(?:\s*\*+|\s*:|\s*[\r\n]|\s*$)")

    combined_pattern = "|".join(pattern_parts)
    matches = list(re.finditer(combined_pattern, text, flags=re.IGNORECASE))

    if not matches:
        return [("THÔNG TIN CHUNG", text.strip())]

    sections: list[tuple[str, str]] = []

    # Nội dung trước tiêu đề đầu tiên (nếu có)
    if matches[0].start() > 0:
        pre_content = text[: matches[0].start()].strip()
        if pre_content:
            sections.append(("TỔNG QUAN", pre_content))

    for i in range(len(matches)):
        match = matches[i]
        header_name = match.group(0).strip()
        # Clean markdown formatting from header_name
        header_clean = re.sub(r"^[#\*\d\.\s]+|[\*\:\s]+$", "", header_name)

        start_idx = match.end()
        end_idx = matches[i + 1].start() if i + 1 < len(matches) else len(text)

        content = text[start_idx:end_idx].strip()
        if content:
            sections.append((header_clean, content))

    return sections


def chunk_document(
    text: str,
    *,
    drug_id: str,
    source_url: str = "",
    chunk_size: int = 800,
    chunk_overlap: int = 120,
    section_headers: list[str] | None = None,
) -> list[Chunk]:
    """Cắt một tờ HDSD thành các chunk có truy vết nguồn."""
    if not text:
        return []

    sections = split_by_sections(text, section_headers=section_headers)
    chunks: list[Chunk] = []

    current_char_offset = 0

    for section_name, section_text in sections:
        sec_start = text.find(section_text, current_char_offset)
        if sec_start == -1:
            sec_start = current_char_offset
        sec_end = sec_start + len(section_text)
        current_char_offset = sec_end

        # Nếu section ngắn hơn chunk_size -> Tạo 1 chunk nguyên văn duy nhất cho section
        if len(section_text) <= chunk_size:
            chunks.append(
                Chunk(
                    text=section_text,
                    drug_id=drug_id,
                    source_url=source_url,
                    page=None,
                    section=section_name,
                    char_start=sec_start,
                    char_end=sec_end,
                )
            )
        else:
            # Cắt theo câu/đoạn văn để tránh cắt ngang giữa từ
            paragraphs = section_text.split("\n\n")
            sub_chunk_lines: list[str] = []
            sub_chunk_len = 0
            sub_start = sec_start

            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue

                if sub_chunk_len + len(para) > chunk_size and sub_chunk_lines:
                    chunk_str = "\n\n".join(sub_chunk_lines)
                    sub_end = sub_start + len(chunk_str)
                    chunks.append(
                        Chunk(
                            text=chunk_str,
                            drug_id=drug_id,
                            source_url=source_url,
                            page=None,
                            section=section_name,
                            char_start=sub_start,
                            char_end=sub_end,
                        )
                    )
                    # Overlap
                    sub_chunk_lines = [para]
                    sub_chunk_len = len(para)
                    sub_start = text.find(para, sub_start)
                else:
                    sub_chunk_lines.append(para)
                    sub_chunk_len += len(para) + 2

            if sub_chunk_lines:
                chunk_str = "\n\n".join(sub_chunk_lines)
                sub_end = sub_start + len(chunk_str)
                chunks.append(
                    Chunk(
                        text=chunk_str,
                        drug_id=drug_id,
                        source_url=source_url,
                        page=None,
                        section=section_name,
                        char_start=sub_start,
                        char_end=sub_end,
                    )
                )

    return chunks
