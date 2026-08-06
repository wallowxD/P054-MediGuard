"""google oauth: nullable password_hash + oauth_identities

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-05

Hai thay đổi cho đăng nhập Google (ADR 0016):

1. `users.password_hash` chuyển sang nullable — tài khoản chỉ đăng nhập Google không có
   mật khẩu nội bộ.
2. Bảng mới `oauth_identities` liên kết user với danh tính provider bên ngoài qua
   `(provider, provider_subject)`.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=True)

    op.create_table(
        "oauth_identities",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_subject", sa.String(length=255), nullable=False),
        sa.Column("provider_email", sa.String(length=320), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("provider", "provider_subject", name="uq_oauth_identity_provider_subject"),
        comment="Liên kết OAuth. RLS bật, không policy: chỉ backend (role sở hữu) truy cập.",
    )
    op.create_index("ix_oauth_identities_user_id", "oauth_identities", ["user_id"])

    # ★ Cùng lý do với users/drugs — PostgREST expose bảng public qua anon key.
    op.execute("ALTER TABLE oauth_identities ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # ⚠️ Nếu đã có user chỉ đăng nhập Google (password_hash NULL), bước alter_column cuối
    # sẽ lỗi NOT NULL violation — xoá hoặc gán mật khẩu cho các user đó trước khi downgrade.
    op.drop_index("ix_oauth_identities_user_id", table_name="oauth_identities")
    op.drop_table("oauth_identities")
    op.alter_column("users", "password_hash", existing_type=sa.String(length=255), nullable=False)
