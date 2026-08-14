"""Bảng `diseases` — danh mục bệnh nền được duyệt, phục vụ ô gợi ý ở màn tra cứu.

Đừng nhầm với `patient_conditions`: bảng đó lưu tình trạng đặc biệt của HỒ SƠ (4 giá trị
cố định, lưu lâu dài theo tài khoản), còn bảng này là danh mục bệnh nền mà người dùng
chọn lại ở TỪNG LƯỢT tra cứu.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base

DISEASE_VERSION_V1 = "v1"
DISEASE_VERSION_V2 = "v2"
DISEASE_ALIAS_REVIEW_PENDING = "pending_review"
DISEASE_ALIAS_REVIEW_APPROVED = "approved"
DISEASE_ALIAS_REVIEW_REJECTED = "rejected"


class Disease(Base):
    """Một bệnh nền trong danh mục được duyệt.

    ★ `name_unaccent` phải dùng ĐÚNG công thức mà `disease_repository.py` áp cho
      `drug_disease_interactions.disease_name_unaccent`:

          remove_vietnamese_accents(name).lower().strip()

      Hai bên lệch nhau thì exact lookup theo cặp (hoạt chất, bệnh) không join được:
      người dùng chọn một bệnh có thật trong danh mục nhưng vẫn nhận "chưa có dữ liệu".

    Danh mục là TẬP ĐÓNG do đội duyệt — người dùng chọn từ gợi ý, không tự tạo bệnh mới.
    Tên bệnh tự do sẽ không bao giờ khớp được với một bản ghi có evidence.
    """

    __tablename__ = "diseases"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    name_unaccent: Mapped[str] = mapped_column(Text, nullable=False)
    # Ba cột legacy đã tồn tại trên Supabase ngoài migration 0005. Giữ trong model để Alembic
    # autogenerate không đề xuất xóa dữ liệu cũ; catalog canonical v2 không phụ thuộc các cột này.
    disease_name_unaccent: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String(16), nullable=False, server_default=DISEASE_VERSION_V1)
    concept_code: Mapped[str | None] = mapped_column(String(128))
    body_system: Mapped[str | None] = mapped_column(String(64))
    concept_type: Mapped[str | None] = mapped_column(String(64))

    # Bỏ một bệnh khỏi gợi ý mà vẫn giữ được các bản ghi trỏ tới nó; không xoá cứng.
    # `text("true")` chứ không `func.true()`: cái sau compile thành `DEFAULT true()`, sai
    # cú pháp PostgreSQL và lệch với `sa.text("true")` mà revision 0005 đã dùng.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("version", "name", name="uq_diseases_version_name"),
        UniqueConstraint("version", "name_unaccent", name="uq_diseases_version_name_unaccent"),
        UniqueConstraint("version", "concept_code", name="uq_diseases_version_concept_code"),
        Index("idx_diseases_unaccent", "disease_name_unaccent"),
        Index("idx_diseases_active_version_name", "version", "is_active", "name_unaccent"),
        # Phải khớp COMMENT ON TABLE trong revision 0005, nếu không autogenerate sẽ sinh
        # lệnh drop_table_comment.
        {"comment": "Danh mục bệnh nền được duyệt, dùng cho ô gợi ý ở màn tra cứu."},
    )

    def __repr__(self) -> str:
        return f"<Disease {self.name!r} version={self.version!r} active={self.is_active}>"


class DiseaseAlias(Base):
    """Ánh xạ exact từ raw condition mention sang canonical disease v2."""

    __tablename__ = "disease_aliases"

    id: Mapped[uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True)
    disease_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("diseases.id", ondelete="CASCADE"), nullable=False
    )
    raw_name: Mapped[str] = mapped_column(Text, nullable=False)
    raw_name_unaccent: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(16), nullable=False, server_default=DISEASE_VERSION_V2)
    expression: Mapped[str] = mapped_column(String(16), nullable=False)
    is_compound: Mapped[bool] = mapped_column(Boolean, nullable=False)
    component_count: Mapped[int] = mapped_column(Integer, nullable=False)
    severity: Mapped[str | None] = mapped_column(String(16))
    course: Mapped[str | None] = mapped_column(String(16))
    stage: Mapped[str | None] = mapped_column(String(32))
    dialysis: Mapped[bool | None] = mapped_column(Boolean)
    criteria_text: Mapped[list[str]] = mapped_column(
        postgresql.JSONB, nullable=False, server_default=text("'[]'::jsonb")
    )
    review_status: Mapped[str] = mapped_column(String(32), nullable=False, server_default=DISEASE_ALIAS_REVIEW_PENDING)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("version", "disease_id", "raw_name_unaccent", name="uq_disease_aliases_version_disease_raw"),
        CheckConstraint(
            "expression IN ('single', 'and', 'or', 'mixed', 'unclear')", name="ck_disease_aliases_expression"
        ),
        CheckConstraint("component_count > 0", name="ck_disease_aliases_component_count"),
        CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_disease_aliases_review_status",
        ),
        Index("idx_disease_aliases_disease", "disease_id"),
        Index("idx_disease_aliases_raw_version", "raw_name_unaccent", "version"),
        {"comment": "Ánh xạ raw condition mention sang canonical disease; exact lookup, không similarity."},
    )

    def __repr__(self) -> str:
        return f"<DiseaseAlias {self.raw_name!r} disease_id={self.disease_id} version={self.version!r}>"
