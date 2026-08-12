"""Bảng `drugs` — danh mục thuốc bệnh viện đã ingest.

Model này được viết ĐỂ KHỚP bảng đã tồn tại trên Supabase, không phải để định nghĩa lại
nó. Mọi thay đổi cột phải đi qua một revision Alembic riêng; sửa model mà quên migration
sẽ làm `--autogenerate` lần sau sinh ra diff bất ngờ.
"""

import uuid
from datetime import datetime

from sqlalchemy import Index, Text, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base


class Drug(Base):
    """Một mục trong danh mục — mức biệt dược, không phải mức hoạt chất."""

    __tablename__ = "drugs"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    brand_name: Mapped[str] = mapped_column(Text, nullable=False)
    # Bản bỏ dấu của brand_name, dùng cho khớp mờ tên tiếng Việt. Đây là khoá matching,
    # KHÔNG phải text hiển thị — xem specs/001-core-interaction-check/data-model.md.
    brand_name_unaccent: Mapped[str] = mapped_column(Text, nullable=False)

    ingredient_raw: Mapped[str] = mapped_column(Text, nullable=False)
    # Một biệt dược có thể có nhiều hoạt chất, nên đây là mảng chứ không phải chuỗi.
    # Truy vấn chứa-phần-tử đi qua index GIN bên dưới.
    canonical_ingredients: Mapped[list[str]] = mapped_column(postgresql.ARRAY(Text), nullable=False)

    dosage_form: Mapped[str | None] = mapped_column(Text)
    route: Mapped[str | None] = mapped_column(Text)
    manufacturer: Mapped[str | None] = mapped_column(Text)

    # Nguồn gốc của mọi citation liên quan tới thuốc này. Hiện 1500/1500 dòng đều có giá trị.
    leaflet_url: Mapped[str | None] = mapped_column(Text)

    insurance_payment_pct: Mapped[str | None] = mapped_column(Text)
    indication_limits: Mapped[str | None] = mapped_column(Text)

    # Trường v2: Phân loại và Tóm tắt cho UI
    pharmacological_class: Mapped[str | None] = mapped_column(Text)
    therapeutic_effect: Mapped[str | None] = mapped_column(Text)
    is_prescription: Mapped[bool | None] = mapped_column(default=False)

    summary_indications: Mapped[str | None] = mapped_column(Text)
    summary_contraindications: Mapped[str | None] = mapped_column(Text)
    summary_dosage: Mapped[str | None] = mapped_column(Text)
    summary_precautions: Mapped[str | None] = mapped_column(Text)
    summary_side_effects: Mapped[str | None] = mapped_column(Text)
    special_notes: Mapped[str | None] = mapped_column(Text)

    # Nội dung trích từ tờ HDSD, giữ nguyên văn.
    indications: Mapped[str | None] = mapped_column(Text)
    contraindications: Mapped[str | None] = mapped_column(Text)
    dosage_and_admin: Mapped[str | None] = mapped_column(Text)
    warnings_and_precautions: Mapped[str | None] = mapped_column(Text)
    side_effects: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)

    version: Mapped[str | None] = mapped_column(Text, default="v2", server_default="v2")

    created_at: Mapped[datetime | None] = mapped_column(postgresql.TIMESTAMP(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(postgresql.TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_drugs_brand_unaccent", "brand_name_unaccent"),
        # GIN cho toán tử mảng (`canonical_ingredients @> ARRAY[...]`); btree không dùng được.
        Index("idx_drugs_canonical_ingredients", "canonical_ingredients", postgresql_using="gin"),
        Index("idx_drugs_version", "version"),
    )

    def __repr__(self) -> str:
        return f"<Drug id={self.id} brand_name={self.brand_name!r}>"
