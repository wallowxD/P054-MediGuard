"""add canonical disease catalog v2 and exact alias mapping

Revision ID: 0007
Revises: 0006
Create Date: 2026-08-13

Migration chỉ tạo schema và gắn version=v1 cho dữ liệu cũ. Dữ liệu v2 được import riêng từ artifact
đã kiểm tra bằng `medsafe.ingestion.condition_normalization_import` để migration vẫn tự chứa và có thể
chạy ở mọi môi trường không bundle thư mục dataset.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Production từng được bổ sung trực tiếp `version VARCHAR(50) DEFAULT 'v2'` ngoài Alembic. Dùng
    # IF NOT EXISTS để revision chạy được cả trên database dựng sạch từ 0005 lẫn Supabase đang drift.
    op.execute("ALTER TABLE diseases ADD COLUMN IF NOT EXISTS version VARCHAR(16) DEFAULT 'v1'")
    op.execute("ALTER TABLE diseases ADD COLUMN IF NOT EXISTS concept_code VARCHAR(128)")
    op.execute("ALTER TABLE diseases ADD COLUMN IF NOT EXISTS body_system VARCHAR(64)")
    op.execute("ALTER TABLE diseases ADD COLUMN IF NOT EXISTS concept_type VARCHAR(64)")
    # Dòng chưa có concept_code là catalog raw/legacy. Chuyển chúng về v1 kể cả khi schema drift trước
    # đây đã mặc định sai là v2; không sửa ID, tên hoặc dữ liệu mô tả hiện hữu.
    op.execute("UPDATE diseases SET version = 'v1' WHERE concept_code IS NULL")
    op.execute("ALTER TABLE diseases ALTER COLUMN version TYPE VARCHAR(16)")
    op.execute("ALTER TABLE diseases ALTER COLUMN version SET DEFAULT 'v1'")
    op.execute("ALTER TABLE diseases ALTER COLUMN version SET NOT NULL")
    op.execute("ALTER TABLE diseases DROP CONSTRAINT IF EXISTS uq_diseases_name")
    op.execute("ALTER TABLE diseases DROP CONSTRAINT IF EXISTS uq_diseases_name_unaccent")
    op.create_unique_constraint("uq_diseases_version_name", "diseases", ["version", "name"])
    op.create_unique_constraint("uq_diseases_version_name_unaccent", "diseases", ["version", "name_unaccent"])
    op.create_unique_constraint("uq_diseases_version_concept_code", "diseases", ["version", "concept_code"])
    op.create_index(
        "idx_diseases_active_version_name",
        "diseases",
        ["version", "is_active", "name_unaccent"],
    )

    op.create_table(
        "disease_aliases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "disease_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("diseases.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("raw_name", sa.Text(), nullable=False),
        sa.Column("raw_name_unaccent", sa.Text(), nullable=False),
        sa.Column("version", sa.String(length=16), nullable=False, server_default="v2"),
        sa.Column("expression", sa.String(length=16), nullable=False),
        sa.Column("is_compound", sa.Boolean(), nullable=False),
        sa.Column("component_count", sa.Integer(), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=True),
        sa.Column("course", sa.String(length=16), nullable=True),
        sa.Column("stage", sa.String(length=32), nullable=True),
        sa.Column("dialysis", sa.Boolean(), nullable=True),
        sa.Column("criteria_text", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("review_status", sa.String(length=32), nullable=False, server_default="pending_review"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "expression IN ('single', 'and', 'or', 'mixed', 'unclear')",
            name="ck_disease_aliases_expression",
        ),
        sa.CheckConstraint("component_count > 0", name="ck_disease_aliases_component_count"),
        sa.CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'rejected')",
            name="ck_disease_aliases_review_status",
        ),
        sa.UniqueConstraint(
            "version",
            "disease_id",
            "raw_name_unaccent",
            name="uq_disease_aliases_version_disease_raw",
        ),
        comment="Ánh xạ raw condition mention sang canonical disease; exact lookup, không similarity.",
    )
    op.create_index("idx_disease_aliases_disease", "disease_aliases", ["disease_id"])
    op.create_index("idx_disease_aliases_raw_version", "disease_aliases", ["raw_name_unaccent", "version"])
    op.execute("ALTER TABLE disease_aliases ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_table("disease_aliases")
    op.execute("DELETE FROM diseases WHERE version <> 'v1'")
    op.drop_index("idx_diseases_active_version_name", table_name="diseases")
    op.drop_constraint("uq_diseases_version_concept_code", "diseases", type_="unique")
    op.drop_constraint("uq_diseases_version_name_unaccent", "diseases", type_="unique")
    op.drop_constraint("uq_diseases_version_name", "diseases", type_="unique")
    op.drop_column("diseases", "concept_type")
    op.drop_column("diseases", "body_system")
    op.drop_column("diseases", "concept_code")
    op.drop_column("diseases", "version")
    op.create_unique_constraint("uq_diseases_name", "diseases", ["name"])
    op.create_unique_constraint("uq_diseases_name_unaccent", "diseases", ["name_unaccent"])
