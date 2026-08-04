"""create users table

Revision ID: 0001
Revises:
Create Date: 2026-08-04

Bảng tài khoản đăng nhập của Health System X. Xem ADR 0015 để biết vì sao dự án tự sở
hữu identity thay vì dùng Supabase Auth.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            # gen_random_uuid() có sẵn từ PostgreSQL 13, không cần extension pgcrypto.
            # Ứng dụng vẫn tự sinh UUID; đây là lưới an toàn cho INSERT chạy tay.
            server_default=sa.text("gen_random_uuid()"),
        ),
        # 320 = 64 (local) + 1 (@) + 255 (domain) theo RFC 5321.
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="PATIENT"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # CHECK thay vì PostgreSQL ENUM: thêm role mới chỉ cần sửa constraint, còn ENUM
        # phải ALTER TYPE và không rollback được trong cùng transaction.
        sa.CheckConstraint("role IN ('PATIENT', 'PHARMACIST')", name="ck_users_role"),
    )

    # unique + index trong một index duy nhất, khớp mapped_column(unique=True, index=True).
    # Email luôn được hạ chữ thường ở domain/auth.normalize_email() trước khi ghi/tra,
    # nên không cần citext.
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ★ BẮT BUỘC VỚI SUPABASE — đừng gỡ dòng này.
    # PostgREST của Supabase expose mọi bảng trong schema `public` qua anon key, mà anon
    # key nằm công khai trong bundle frontend. Không bật RLS thì bất kỳ ai cũng GET được
    # toàn bộ hash mật khẩu qua REST API. Bật RLS và KHÔNG tạo policy nào = anon và
    # authenticated không đọc được dòng nào; backend kết nối bằng role sở hữu bảng nên
    # bỏ qua RLS và vẫn hoạt động bình thường.
    op.execute("ALTER TABLE users ENABLE ROW LEVEL SECURITY")
    op.execute(
        "COMMENT ON TABLE users IS "
        "'Tài khoản Health System X. RLS bật, không policy: chỉ backend (role sở hữu) truy cập.'"
    )


def downgrade() -> None:
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
