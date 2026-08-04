"""Bảng tương tác thuốc–thuốc và thuốc–thực phẩm.

★ `drug_drug_interactions` là nguồn sự thật cho câu hỏi "cặp thuốc này có tương tác
  không". Truy vấn phải là exact lookup theo `(ingredient_a_norm, ingredient_b_norm)` —
  similarity search bị CẤM dùng làm cơ sở kết luận ở đây, xem ADR 0004 và ADR 0012.
  "Warfarin + Tamoxifen" mà trả về bản ghi "Acenocoumarol + Tamoxifen" thì nguồn và trích
  dẫn đều thật nhưng sai cặp thuốc.

Model khớp bảng đã tồn tại trên Supabase, không định nghĩa lại.
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base

# Giá trị `severity` thực tế đang có trong database. Khớp `domain.severity.Severity`
# và các token màu `severity-*` ở frontend.
SEVERITY_VALUES = ("contraindicated", "major", "moderate", "minor", "unknown")

# Xuất xứ bản ghi. `national_database` đã được thẩm định sẵn nên vào thẳng `approved`;
# `leaflet_ocr` do pipeline OCR sinh ra nên phải qua dược sĩ.
SOURCE_TYPE_VALUES = ("leaflet_ocr", "national_database")

# ⚠ Database dùng `pending_review`, còn specs/app-flow.md và contract API dùng `pending`.
# Chưa map ở tầng nào cả. Endpoint nào trả review status ra ngoài phải chuyển đổi ở
# schema layer; đừng đổi dữ liệu trong bảng để "cho khớp".
REVIEW_STATUS_PENDING = "pending_review"
REVIEW_STATUS_APPROVED = "approved"
REVIEW_STATUS_REJECTED = "rejected"


class DrugDrugInteraction(Base):
    """Một cặp hoạt chất đã chuẩn hoá kèm bằng chứng nguyên văn."""

    __tablename__ = "drug_drug_interactions"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    # Đã chuẩn hoá và sắp xếp để cặp không phụ thuộc thứ tự người dùng nhập.
    ingredient_a_norm: Mapped[str] = mapped_column(Text, nullable=False)
    ingredient_b_norm: Mapped[str] = mapped_column(Text, nullable=False)

    # Tất định, suy ra lúc ingestion — không phải output của model lúc request.
    severity: Mapped[str] = mapped_column(String(50), nullable=False)

    mechanism: Mapped[str | None] = mapped_column(Text)
    consequence: Mapped[str | None] = mapped_column(Text)
    management: Mapped[str | None] = mapped_column(Text)

    # NOT NULL theo đúng ADR 0006: không có trích dẫn nguyên văn thì không có bản ghi.
    verbatim_quote: Mapped[str] = mapped_column(Text, nullable=False)

    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_drug_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("drugs.id", ondelete="SET NULL")
    )
    source_leaflet_url: Mapped[str | None] = mapped_column(Text)

    review_status: Mapped[str | None] = mapped_column(String(50), server_default=REVIEW_STATUS_PENDING)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(postgresql.UUID(as_uuid=True))
    reviewed_at: Mapped[datetime | None] = mapped_column(postgresql.TIMESTAMP(timezone=True))

    created_at: Mapped[datetime | None] = mapped_column(postgresql.TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (
        # Cùng một cặp có thể tồn tại hai lần nếu đến từ hai nguồn khác nhau; unique gồm
        # cả source_type chính là để cho phép điều đó mà vẫn chặn trùng trong một nguồn.
        UniqueConstraint("ingredient_a_norm", "ingredient_b_norm", "source_type", name="unique_canonical_pair_source"),
        Index("idx_d2d_pair", "ingredient_a_norm", "ingredient_b_norm"),
        Index("idx_d2d_review_status", "review_status"),
    )

    def __repr__(self) -> str:
        return f"<DrugDrugInteraction {self.ingredient_a_norm}+{self.ingredient_b_norm} {self.severity}>"


class DrugFoodInteraction(Base):
    """Tương tác thuốc–thực phẩm.

    Không có bảng cặp chuẩn cho thực phẩm nên phát hiện đi qua semantic retrieval; bảng
    này lưu kết quả đã được xác nhận kèm trích dẫn nguyên văn.
    """

    __tablename__ = "drug_food_interactions"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )

    drug_id: Mapped[uuid.UUID | None] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("drugs.id", ondelete="CASCADE")
    )
    canonical_ingredient: Mapped[str] = mapped_column(Text, nullable=False)
    food_item: Mapped[str] = mapped_column(Text, nullable=False)
    effect_description: Mapped[str] = mapped_column(Text, nullable=False)
    management: Mapped[str | None] = mapped_column(Text)
    verbatim_quote: Mapped[str] = mapped_column(Text, nullable=False)

    review_status: Mapped[str | None] = mapped_column(String(50), server_default=REVIEW_STATUS_PENDING)
    # ⚠ Bảng này KHÔNG có `reviewer_id`/`reviewed_at` như `drug_drug_interactions`, nên
    # duyệt cảnh báo thuốc–thực phẩm hiện không ghi lại được ai duyệt và duyệt lúc nào.
    # Cần quyết định của team trước khi thêm cột — đừng tự ý bổ sung ở đây.

    created_at: Mapped[datetime | None] = mapped_column(postgresql.TIMESTAMP(timezone=True), server_default=func.now())

    __table_args__ = (Index("idx_d2f_drug_id", "drug_id"),)

    def __repr__(self) -> str:
        return f"<DrugFoodInteraction {self.canonical_ingredient}+{self.food_item!r}>"
