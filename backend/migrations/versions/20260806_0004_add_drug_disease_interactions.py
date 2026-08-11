"""add drug_disease_interactions table

Revision ID: 0004
Revises: 0003
Create Date: 2026-08-06

★ Revision này ĐƯỢC ĐÁNH SỐ LẠI TỪ 0003 THÀNH 0004 (VMEC-72).

File này và `20260805_0003_google_oauth.py` từng cùng khai báo `revision = "0003"` và
cùng `down_revision = "0002"`. Hậu quả:

- Alembic cảnh báo `Revision 0003 is present more than once`, báo hai head và
  `alembic upgrade head` chết với `Multiple head revisions are present`;
- database Supabase đã đóng dấu `alembic_version = '0003'` sau khi chạy migration
  google_oauth, nên Alembic coi `0003` là xong và migration này KHÔNG BAO GIỜ chạy.
  Bảng `drug_disease_interactions` vì thế chưa từng tồn tại, dù model và repository đã
  có trong code — mọi query qua `disease_repository.py` chết với `relation … does not
  exist`. Xem "Chặn kỹ thuật" trong ADR 0017.

Đổi thành mắt xích tiếp theo (`0004` nối sau `0003`) thay vì mắt xích song song để lịch
sử tuyến tính trở lại và `upgrade head` thực sự tạo được bảng. KHÔNG dùng
`alembic stamp` để lách: stamp chỉ đổi dấu mốc chứ không tạo bảng.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "drug_disease_interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "drug_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("drugs.id", ondelete="SET NULL"), nullable=True
        ),
        sa.Column("canonical_ingredient", sa.Text(), nullable=False),
        sa.Column("disease_name", sa.Text(), nullable=False),
        sa.Column("disease_name_unaccent", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("effect_description", sa.Text(), nullable=True),
        sa.Column("management", sa.Text(), nullable=True),
        sa.Column("verbatim_quote", sa.Text(), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_leaflet_url", sa.Text(), nullable=True),
        sa.Column("review_status", sa.String(length=50), server_default="pending_review", nullable=True),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewed_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.UniqueConstraint(
            "canonical_ingredient", "disease_name_unaccent", "source_type", name="unique_disease_interaction_source"
        ),
    )
    op.create_index("idx_d2dis_ingredient", "drug_disease_interactions", ["canonical_ingredient"])
    op.create_index("idx_d2dis_disease_unaccent", "drug_disease_interactions", ["disease_name_unaccent"])
    op.create_index("idx_d2dis_review_status", "drug_disease_interactions", ["review_status"])

    # Cùng lý do với `users` ở revision 0001 và bốn bảng danh mục ở revision 0002:
    # PostgREST expose mọi bảng schema `public` qua anon key. Dòng này thiếu trong bản
    # gốc của migration; bổ sung được vì bảng chưa từng tồn tại nên không có dữ liệu để
    # mất. Bật RLS + không policy = backend (role sở hữu) vẫn đọc ghi bình thường.
    op.execute("ALTER TABLE drug_disease_interactions ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("idx_d2dis_review_status", table_name="drug_disease_interactions")
    op.drop_index("idx_d2dis_disease_unaccent", table_name="drug_disease_interactions")
    op.drop_index("idx_d2dis_ingredient", table_name="drug_disease_interactions")
    op.drop_table("drug_disease_interactions")
