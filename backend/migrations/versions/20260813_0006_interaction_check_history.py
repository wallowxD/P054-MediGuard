"""add interaction check history snapshots

Revision ID: 0006
Revises: 0005
Create Date: 2026-08-13
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "interaction_checks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("response_version", sa.String(length=16), nullable=False, server_default="v1"),
        sa.Column("drug_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("disease_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("severity_counts", postgresql.JSONB(), nullable=False),
        sa.Column("summary_status", sa.String(length=32), nullable=False),
        sa.Column("result_count", sa.Integer(), nullable=False),
        sa.Column("note_count", sa.Integer(), nullable=False),
        sa.Column("unavailable_count", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("idx_interaction_checks_user_created", "interaction_checks", ["user_id", "created_at"])
    op.create_table(
        "interaction_check_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "check_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("interaction_checks.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("entry_type", sa.String(length=24), nullable=False),
        sa.Column("ordinal", sa.Integer(), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.CheckConstraint("entry_type IN ('interaction', 'note', 'unavailable')", name="ck_check_entries_type"),
        sa.UniqueConstraint("check_id", "ordinal", name="uq_check_entries_ordinal"),
    )
    op.create_index("idx_check_entries_check", "interaction_check_entries", ["check_id"])
    for table in ("interaction_checks", "interaction_check_entries"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_table("interaction_check_entries")
    op.drop_table("interaction_checks")
