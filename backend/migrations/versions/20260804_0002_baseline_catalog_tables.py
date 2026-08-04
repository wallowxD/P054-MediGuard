"""baseline catalog and interaction tables

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-04

★ REVISION NÀY GHI LẠI SCHEMA ĐÃ TỒN TẠI, KHÔNG TẠO RA CÁI MỚI.

Bốn bảng `drugs`, `drug_drug_interactions`, `drug_food_interactions` và `evidence_chunks`
được tạo tay bằng Supabase SQL Editor trước khi project dùng Alembic, và đang chứa dữ
liệu thật do pipeline ingestion sinh ra. Revision này viết lại đúng schema đó để:

- môi trường mới (Docker local, máy thành viên mới) dựng được cùng schema bằng
  `make migrate`;
- Alembic có baseline để so sánh ở những revision sau.

Trên database Supabase đang chạy, revision này được đánh dấu đã áp dụng bằng
`alembic stamp 0002` — KHÔNG chạy `upgrade`, vì bảng đã tồn tại và chạy lại sẽ lỗi.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "drugs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("brand_name", sa.Text(), nullable=False),
        sa.Column("brand_name_unaccent", sa.Text(), nullable=False),
        sa.Column("ingredient_raw", sa.Text(), nullable=False),
        sa.Column("canonical_ingredients", postgresql.ARRAY(sa.Text()), nullable=False),
        sa.Column("dosage_form", sa.Text(), nullable=True),
        sa.Column("route", sa.Text(), nullable=True),
        sa.Column("manufacturer", sa.Text(), nullable=True),
        sa.Column("leaflet_url", sa.Text(), nullable=True),
        sa.Column("insurance_payment_pct", sa.Text(), nullable=True),
        sa.Column("indication_limits", sa.Text(), nullable=True),
        sa.Column("indications", sa.Text(), nullable=True),
        sa.Column("contraindications", sa.Text(), nullable=True),
        sa.Column("dosage_and_admin", sa.Text(), nullable=True),
        sa.Column("warnings_and_precautions", sa.Text(), nullable=True),
        sa.Column("side_effects", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
    )
    op.create_index("idx_drugs_brand_unaccent", "drugs", ["brand_name_unaccent"])
    # GIN cho toán tử chứa-phần-tử trên mảng; btree không phục vụ được truy vấn đó.
    op.create_index("idx_drugs_canonical_ingredients", "drugs", ["canonical_ingredients"], postgresql_using="gin")

    op.create_table(
        "drug_drug_interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ingredient_a_norm", sa.Text(), nullable=False),
        sa.Column("ingredient_b_norm", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=50), nullable=False),
        sa.Column("mechanism", sa.Text(), nullable=True),
        sa.Column("consequence", sa.Text(), nullable=True),
        sa.Column("management", sa.Text(), nullable=True),
        # NOT NULL theo ADR 0006: không trích dẫn nguyên văn thì không được có bản ghi.
        sa.Column("verbatim_quote", sa.Text(), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column(
            "source_drug_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("drugs.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("source_leaflet_url", sa.Text(), nullable=True),
        sa.Column("review_status", sa.String(length=50), nullable=True, server_default="pending_review"),
        sa.Column("reviewer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
        # Cho phép cùng một cặp tồn tại ở nhiều nguồn, nhưng chặn trùng trong một nguồn.
        sa.UniqueConstraint(
            "ingredient_a_norm", "ingredient_b_norm", "source_type", name="unique_canonical_pair_source"
        ),
    )
    op.create_index("idx_d2d_pair", "drug_drug_interactions", ["ingredient_a_norm", "ingredient_b_norm"])
    op.create_index("idx_d2d_review_status", "drug_drug_interactions", ["review_status"])

    op.create_table(
        "drug_food_interactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "drug_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("drugs.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column("canonical_ingredient", sa.Text(), nullable=False),
        sa.Column("food_item", sa.Text(), nullable=False),
        sa.Column("effect_description", sa.Text(), nullable=False),
        sa.Column("management", sa.Text(), nullable=True),
        sa.Column("verbatim_quote", sa.Text(), nullable=False),
        sa.Column("review_status", sa.String(length=50), nullable=True, server_default="pending_review"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
    )
    op.create_index("idx_d2f_drug_id", "drug_food_interactions", ["drug_id"])

    op.create_table(
        "evidence_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "drug_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("drugs.id", ondelete="CASCADE"), nullable=True
        ),
        sa.Column("section_name", sa.Text(), nullable=False),
        # Nguyên văn từ tờ HDSD. Không chuẩn hoá, không cắt gọt.
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False),
        sa.Column("start_char", sa.Integer(), nullable=True),
        sa.Column("end_char", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True, server_default=sa.text("now()")),
    )
    op.create_index("idx_evidence_drug_id", "evidence_chunks", ["drug_id"])

    # Cùng lý do với bảng `users` ở revision 0001: PostgREST expose mọi bảng schema
    # `public` qua anon key. Bốn bảng này đã bật RLS trên Supabase; bật ở đây để môi
    # trường dựng mới có cùng tư thế bảo mật.
    for table in ("drugs", "drug_drug_interactions", "drug_food_interactions", "evidence_chunks"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # ⚠️ Chạy downgrade trên Supabase sẽ XOÁ TOÀN BỘ danh mục thuốc, dữ liệu tương tác và
    # evidence chunk đã ingest. Chỉ dùng trên database dựng mới.
    op.drop_index("idx_evidence_drug_id", table_name="evidence_chunks")
    op.drop_table("evidence_chunks")
    op.drop_index("idx_d2f_drug_id", table_name="drug_food_interactions")
    op.drop_table("drug_food_interactions")
    op.drop_index("idx_d2d_review_status", table_name="drug_drug_interactions")
    op.drop_index("idx_d2d_pair", table_name="drug_drug_interactions")
    op.drop_table("drug_drug_interactions")
    op.drop_index("idx_drugs_canonical_ingredients", table_name="drugs")
    op.drop_index("idx_drugs_brand_unaccent", table_name="drugs")
    op.drop_table("drugs")
