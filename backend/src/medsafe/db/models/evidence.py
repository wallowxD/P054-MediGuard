"""Bảng `evidence_chunks` — đoạn nguyên văn tách từ tờ HDSD.

Đây là đầu kia của mọi citation: Qdrant chỉ giữ vector cùng con trỏ, còn nội dung hiển thị
cho người dùng phải resolve về đúng dòng trong bảng này (ADR 0013). Vì vậy `content` phải
giữ NGUYÊN VĂN, không chuẩn hoá, không cắt gọt.

Model khớp bảng đã tồn tại trên Supabase, không định nghĩa lại.
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, Text, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base


class EvidenceChunk(Base):
    __tablename__ = "evidence_chunks"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    drug_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("drugs.id", ondelete="CASCADE")
    )

    # Tiêu đề mục trong tờ HDSD, ví dụ "TƯƠNG TÁC THUỐC", "CHỐNG CHỈ ĐỊNH".
    # Dữ liệu hiện có cả dạng viết hoa lẫn viết thường cho cùng một mục
    # ("CHỐNG CHỈ ĐỊNH" và "Chống chỉ định"), nên so khớp phải case-insensitive.
    section_name: Mapped[str] = mapped_column(Text, nullable=False)

    content: Mapped[str] = mapped_column(Text, nullable=False)

    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    # Toạ độ ký tự trong văn bản gốc, dùng để kiểm chứng quote khớp đúng nguồn.
    start_char: Mapped[int | None] = mapped_column(Integer)
    end_char: Mapped[int | None] = mapped_column(Integer)
    # ⚠ Chưa có cột `page`, trong khi `Citation` ở data-model quy định `page` là số dương
    # hoặc null. Cần quyết định của team trước khi thêm cột.

    source_url: Mapped[str | None] = mapped_column(Text)

    version: Mapped[str | None] = mapped_column(Text, server_default="v2")

    created_at: Mapped[datetime | None] = mapped_column(postgresql.TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_evidence_drug_id", "drug_id"),
        Index("idx_evidence_version", "version"),
    )

    def __repr__(self) -> str:
        return f"<EvidenceChunk id={self.id} section={self.section_name!r} idx={self.chunk_index}>"
