"""patient health profile, self-reported conditions and disease catalog

Revision ID: 0005
Revises: 0004
Create Date: 2026-08-11

Ba bảng của tính năng thuốc – bệnh nền (VMEC-73). Quyết định: ADR 0017; đặc tả:
specs/002-drug-disease-check/spec.md.

Đây là lần đầu dự án lưu DỮ LIỆU SỨC KHOẺ Ở TRẠNG THÁI NGHỈ. Ba ràng buộc đi kèm, đọc
trước khi sửa file này:

1. Hồ sơ nằm ở bảng riêng, KHÔNG thêm cột vào `users`. `users` là bảng identity (ADR
   0015) và `AuthUserResponse` được nhét nguyên vào JWT của NextAuth — thêm bệnh nền vào
   đó là đưa dữ liệu sức khoẻ vào cookie trình duyệt.
2. `patient_conditions` lưu TÌNH TRẠNG ĐẶC BIỆT của hồ sơ (mang thai, cho con bú, suy
   thận, suy gan), KHÔNG phải danh sách bệnh nền của một lượt tra cứu. Bệnh nền của lượt
   tra cứu do người dùng chọn lại mỗi lần và nằm trong request body. Gộp hai thứ làm một
   sẽ khiến hệ thống tự đưa "suy thận" trong hồ sơ vào mọi lượt tra cứu và tự sinh cảnh
   báo — đúng thứ nguyên tắc an toàn số 2 cấm.
3. Lưu `date_of_birth`, KHÔNG lưu số tuổi. Tuổi là giá trị dẫn xuất; lưu số tuổi thì sang
   năm dữ liệu sai mà không có tín hiệu nào báo (AC F6.4).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Danh mục bệnh nền cho ô gợi ý, seed từ `DISEASE_CATALOG` trong `demo-ui/js/data.js`.
# Cột không dấu được tính bằng đúng công thức `disease_repository.py` đang dùng cho
# `drug_disease_interactions.disease_name_unaccent`:
#     remove_vietnamese_accents(name).lower().strip()
# Hai bên phải khớp thì exact lookup theo cặp (hoạt chất, bệnh) mới join được. Giá trị
# viết sẵn ở đây thay vì import `medsafe.domain.normalization`: migration phải chạy lại
# ra đúng schema cũ kể cả khi hàm chuẩn hoá đổi ở tương lai.
DISEASE_SEED: tuple[tuple[str, str], ...] = (
    ("Tăng huyết áp", "tang huyet ap"),
    ("Đái tháo đường type 2", "dai thao duong type 2"),
    ("Suy thận mạn", "suy than man"),
    ("Suy gan", "suy gan"),
    ("Suy tim", "suy tim"),
    ("Hen suyễn", "hen suyen"),
    ("Loét dạ dày - tá tràng", "loet da day - ta trang"),
    ("Gout", "gout"),
    ("Cường giáp", "cuong giap"),
    ("Rung nhĩ", "rung nhi"),
    ("Trầm cảm", "tram cam"),
    ("Bệnh phổi tắc nghẽn mạn tính (COPD)", "benh phoi tac nghen man tinh (copd)"),
)


def upgrade() -> None:
    op.create_table(
        "patient_profiles",
        # PK CHÍNH LÀ user_id — đó là cách ép quan hệ 1-1 ở tầng schema. Dùng `id` riêng
        # cộng thêm unique index trên user_id cũng ra kết quả tương đương nhưng để lọt
        # khả năng một user có hai hồ sơ nếu ai đó quên unique.
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("sex", sa.String(length=16), nullable=True),
        # NUMERIC chứ không FLOAT: cân nặng hiện lại đúng số người dùng gõ, không thành
        # 57.99999. (5,2) đủ cho 999.99 kg và (5,1) đủ cho 9999.9 cm.
        sa.Column("weight_kg", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("height_cm", sa.Numeric(precision=5, scale=1), nullable=True),
        # Dấu vết người dùng đã được thông báo và đồng ý cho lưu dữ liệu sức khoẻ. ADR
        # 0017 ghi nghĩa vụ này ở mục Hệ quả nhưng không có chỗ nào lưu; đưa vào ngay
        # migration đầu tiên vì thêm sau thì phải backfill mù cho mọi hồ sơ đã có.
        # NULL = chưa ghi nhận đồng ý, không phải "đã từ chối".
        sa.Column("consented_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Giá trị khớp `GENDER_OPTIONS` của bản demo đã duyệt. CHECK thay vì ENUM, cùng
        # lý do với `users.role` ở revision 0001.
        sa.CheckConstraint("sex IN ('nu', 'nam', 'khac')", name="ck_patient_profiles_sex"),
        # Chặn số vô nghĩa ngay ở database. Biên rộng có chủ ý: đây là lưới an toàn cuối,
        # không phải chỗ thay thế validation của schema layer.
        sa.CheckConstraint(
            "weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 300)", name="ck_patient_profiles_weight"
        ),
        sa.CheckConstraint(
            "height_cm IS NULL OR (height_cm > 0 AND height_cm <= 250)", name="ck_patient_profiles_height"
        ),
        comment="Hồ sơ sức khoẻ TỰ KHAI, 1-1 với users. RLS bật, không policy.",
    )

    op.create_table(
        "patient_conditions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("condition_code", sa.String(length=64), nullable=False),
        # `source` có mặt NGAY từ migration đầu tiên, không thêm sau: thêm sau thì phải
        # backfill toàn bộ dữ liệu đã có mà không có cách nào biết dòng cũ thuộc loại nào.
        sa.Column("source", sa.String(length=32), nullable=False, server_default="self_reported"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "condition_code IN ('mang-thai', 'cho-con-bu', 'suy-than', 'suy-gan')",
            name="ck_patient_conditions_code",
        ),
        sa.CheckConstraint(
            "source IN ('self_reported', 'pharmacist_confirmed')",
            name="ck_patient_conditions_source",
        ),
        # Bấm hai lần cùng một chip không tạo dòng lặp. Index của unique constraint này
        # có tiền tố là user_id nên truy vấn "conditions của một user" dùng được luôn —
        # không tạo thêm index riêng cho user_id.
        sa.UniqueConstraint("user_id", "condition_code", name="uq_patient_conditions_user_code"),
        comment="Tình trạng đặc biệt tự khai của hồ sơ (KHÔNG phải bệnh nền của lượt tra cứu). RLS bật, không policy.",
    )

    op.create_table(
        "diseases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("name_unaccent", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        # Danh mục là TẬP ĐÓNG do đội duyệt: người dùng chọn từ gợi ý chứ không tự tạo
        # bệnh mới, vì tên bệnh tự do sẽ không bao giờ khớp được bản ghi evidence.
        sa.UniqueConstraint("name_unaccent", name="uq_diseases_name_unaccent"),
        comment="Danh mục bệnh nền được duyệt, dùng cho ô gợi ý ở màn tra cứu.",
    )

    op.bulk_insert(
        sa.table(
            "diseases",
            sa.column("name", sa.Text()),
            sa.column("name_unaccent", sa.Text()),
        ),
        [{"name": name, "name_unaccent": unaccent} for name, unaccent in DISEASE_SEED],
    )

    # ★ BẮT BUỘC VỚI SUPABASE — đừng gỡ ba dòng này.
    # PostgREST expose mọi bảng schema `public` qua anon key, mà anon key nằm công khai
    # trong bundle frontend. Với `patient_profiles` và `patient_conditions`, quên bước
    # này là công khai ngày sinh và bệnh nền của TOÀN BỘ người dùng cho bất kỳ ai đọc
    # được bundle. `diseases` không nhạy cảm nhưng vẫn bật cho đồng nhất: backend là
    # security boundary duy nhất (ADR 0015), không có đường đọc trực tiếp nào được mở.
    # Bật RLS + KHÔNG tạo policy = anon/authenticated không thấy dòng nào, còn backend
    # kết nối bằng role sở hữu bảng nên bỏ qua RLS và hoạt động bình thường.
    for table in ("patient_profiles", "patient_conditions", "diseases"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    # ⚠️ Xoá hồ sơ sức khoẻ của toàn bộ người dùng. Chỉ chạy trên database dựng mới.
    op.drop_table("diseases")
    op.drop_table("patient_conditions")
    op.drop_table("patient_profiles")
