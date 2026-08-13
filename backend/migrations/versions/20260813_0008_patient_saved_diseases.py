"""store multiple canonical diseases in patient health profiles

Revision ID: 0008
Revises: 0007
Create Date: 2026-08-13

`patient_conditions` tiếp tục giữ hai tình trạng đặc biệt. Bệnh nền lưu bằng stable
`diseases.id` trong bảng nối riêng; dữ liệu này không tự tham gia lượt tra cứu.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "patient_diseases",
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
        sa.Column(
            "disease_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("diseases.id"),
            nullable=False,
        ),
        sa.Column("source", sa.String(length=32), nullable=False, server_default="self_reported"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "source IN ('self_reported', 'pharmacist_confirmed')",
            name="ck_patient_diseases_source",
        ),
        sa.UniqueConstraint("user_id", "disease_id", name="uq_patient_diseases_user_disease"),
        comment=(
            "Bệnh nền tự khai đã lưu theo tài khoản; chỉ gợi ý, không tự đưa vào lượt tra cứu. "
            "RLS bật, không policy."
        ),
    )
    op.execute("ALTER TABLE patient_diseases ENABLE ROW LEVEL SECURITY")

    # Chỉ migrate mã legacy khi canonical v2 có đúng concept code. Không tìm gần nghĩa,
    # không xoá dòng cũ nếu catalog v2 chưa được import.
    op.execute(
        """
        INSERT INTO patient_diseases (user_id, disease_id, source, created_at)
        SELECT pc.user_id, d.id, pc.source, pc.created_at
        FROM patient_conditions AS pc
        JOIN diseases AS d
          ON d.version = 'v2'
         AND d.is_active IS TRUE
         AND d.concept_code = CASE pc.condition_code
             WHEN 'suy-than' THEN 'renal_impairment'
             WHEN 'suy-gan' THEN 'hepatic_impairment'
         END
        WHERE pc.condition_code IN ('suy-than', 'suy-gan')
        ON CONFLICT ON CONSTRAINT uq_patient_diseases_user_disease DO NOTHING
        """
    )
    op.execute(
        """
        DELETE FROM patient_conditions AS pc
        WHERE pc.condition_code IN ('suy-than', 'suy-gan')
          AND EXISTS (
              SELECT 1
              FROM diseases AS d
              WHERE d.version = 'v2'
                AND d.is_active IS TRUE
                AND d.concept_code = CASE pc.condition_code
                    WHEN 'suy-than' THEN 'renal_impairment'
                    WHEN 'suy-gan' THEN 'hepatic_impairment'
                END
          )
        """
    )


def downgrade() -> None:
    # Không ép disease tuỳ ý trở lại enum 4 mã vì mapping đó làm mất định danh canonical.
    op.drop_table("patient_diseases")
