"""add drug_disease_interactions table

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-06
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: str | None = "0002"
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


def downgrade() -> None:
    op.drop_index("idx_d2dis_review_status", table_name="drug_disease_interactions")
    op.drop_index("idx_d2dis_disease_unaccent", table_name="drug_disease_interactions")
    op.drop_index("idx_d2dis_ingredient", table_name="drug_disease_interactions")
    op.drop_table("drug_disease_interactions")
