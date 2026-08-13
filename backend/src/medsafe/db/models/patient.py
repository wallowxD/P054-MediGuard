"""Hồ sơ sức khoẻ TỰ KHAI — profile, tình trạng đặc biệt và bệnh nền đã lưu.

Gọi là "hồ sơ sức khoẻ tự khai", không gọi là "hồ sơ bệnh án": bệnh án hàm ý dữ liệu do
cơ sở y tế lập và chịu trách nhiệm, đúng thứ sản phẩm này không làm (ADR 0017 mục 4).

★ Hồ sơ KHÔNG tham gia suy luận cảnh báo. Nó được hiển thị lại cho người dùng và gửi kèm
  khi chuyển lượt tra cứu cho dược sĩ. Mọi cảnh báo vẫn phải xuất phát từ trích dẫn
  nguyên văn tờ HDSD (ADR 0006). Đừng viết code tự đọc `patient_conditions` rồi thêm bệnh
  nền vào request tra cứu — đó là suy luận thay người dùng.

★ Các bảng nằm trong schema `public` nên PostgREST của Supabase expose chúng cho anon key
  (khoá này nằm công khai trong bundle frontend). Migration 0005 bật Row Level Security
  và KHÔNG tạo policy nào. Tắt RLS ở đây đồng nghĩa công khai ngày sinh và bệnh nền của
  toàn bộ người dùng.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base

# Khớp `GENDER_OPTIONS` của bản demo đã duyệt ngày 08/08/2026.
SEX_FEMALE = "nu"
SEX_MALE = "nam"
SEX_OTHER = "khac"
SEX_VALUES = (SEX_FEMALE, SEX_MALE, SEX_OTHER)

# Hai tình trạng đặc biệt của HỒ SƠ. Suy thận/suy gan là mã legacy từ revision 0005;
# API mới không nhận chúng nữa vì bệnh nền phải chọn bằng stable ID từ `diseases`.
CONDITION_PREGNANT = "mang-thai"
CONDITION_BREASTFEEDING = "cho-con-bu"
CONDITION_RENAL_IMPAIRMENT = "suy-than"
CONDITION_HEPATIC_IMPAIRMENT = "suy-gan"
SPECIAL_CONDITION_CODES = (
    CONDITION_PREGNANT,
    CONDITION_BREASTFEEDING,
)
LEGACY_CONDITION_CODES = (
    CONDITION_RENAL_IMPAIRMENT,
    CONDITION_HEPATIC_IMPAIRMENT,
)
CONDITION_CODES = SPECIAL_CONDITION_CODES + LEGACY_CONDITION_CODES

# Xuất xứ của một dòng tình trạng. Có mặt ngay từ migration đầu tiên để dược sĩ xác nhận
# được tình trạng mà vẫn phân biệt với dữ liệu người dùng tự khai.
SOURCE_SELF_REPORTED = "self_reported"
SOURCE_PHARMACIST_CONFIRMED = "pharmacist_confirmed"
CONDITION_SOURCES = (SOURCE_SELF_REPORTED, SOURCE_PHARMACIST_CONFIRMED)


class PatientProfile(Base):
    """Hồ sơ sức khoẻ tự khai, quan hệ 1-1 với `users`.

    Quan hệ 1-1 được ép bằng chính khoá chính: `user_id` vừa là PK vừa là FK, nên một
    user không thể có hai hồ sơ dù tầng trên có gọi sai.
    """

    __tablename__ = "patient_profiles"

    # PK = FK. Xoá tài khoản thì hồ sơ đi theo (ON DELETE CASCADE); ngược lại xoá hồ sơ
    # không đụng gì tới tài khoản đăng nhập.
    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    # ★ Lưu NGÀY SINH, không lưu số tuổi. Tuổi là giá trị dẫn xuất, tính lúc hiển thị.
    # Lưu số tuổi thì sang năm dữ liệu sai mà không có tín hiệu nào báo (AC F6.4).
    date_of_birth: Mapped[date | None] = mapped_column(Date)

    sex: Mapped[str | None] = mapped_column(String(16))

    # NUMERIC → Decimal, không phải float: cân nặng hiện lại đúng số người dùng gõ.
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(precision=5, scale=2))
    height_cm: Mapped[Decimal | None] = mapped_column(Numeric(precision=5, scale=1))

    # Người dùng đã được thông báo và đồng ý cho lưu dữ liệu sức khoẻ lúc nào. NULL =
    # chưa ghi nhận đồng ý, KHÔNG phải "đã từ chối" — đừng suy ra ý nghĩa thứ hai từ NULL.
    consented_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("sex IN ('nu', 'nam', 'khac')", name="ck_patient_profiles_sex"),
        CheckConstraint("weight_kg IS NULL OR (weight_kg > 0 AND weight_kg <= 300)", name="ck_patient_profiles_weight"),
        CheckConstraint("height_cm IS NULL OR (height_cm > 0 AND height_cm <= 250)", name="ck_patient_profiles_height"),
        # Phải khớp COMMENT ON TABLE trong revision 0005, nếu không autogenerate sẽ sinh
        # lệnh drop_table_comment.
        {"comment": "Hồ sơ sức khoẻ TỰ KHAI, 1-1 với users. RLS bật, không policy."},
    )

    def __repr__(self) -> str:
        # KHÔNG đưa ngày sinh, cân nặng hay chiều cao vào repr — repr hay lọt vào log và
        # traceback, mà đây là dữ liệu sức khoẻ.
        return f"<PatientProfile user_id={self.user_id}>"


class PatientCondition(Base):
    """Một tình trạng đặc biệt của hồ sơ, quan hệ 1-n với `users`.

    ★ ĐÂY KHÔNG PHẢI danh sách bệnh nền của một lượt tra cứu. Hai thứ khác nhau về vòng
      đời (lưu lâu dài theo tài khoản / nhập lại mỗi lượt), tập giá trị (4 tình trạng cố
      định / danh mục `diseases`) và vai trò (hiển thị lại và gửi cho chuyên môn / đầu
      vào của exact lookup). Gộp chúng lại sẽ khiến hệ thống tự sinh cảnh báo từ hồ sơ.
    """

    __tablename__ = "patient_conditions"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    condition_code: Mapped[str] = mapped_column(String(64), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default=SOURCE_SELF_REPORTED)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "condition_code IN ('mang-thai', 'cho-con-bu', 'suy-than', 'suy-gan')",
            name="ck_patient_conditions_code",
        ),
        CheckConstraint(
            "source IN ('self_reported', 'pharmacist_confirmed')",
            name="ck_patient_conditions_source",
        ),
        UniqueConstraint("user_id", "condition_code", name="uq_patient_conditions_user_code"),
        {
            "comment": (
                "Tình trạng đặc biệt tự khai của hồ sơ (KHÔNG phải bệnh nền của lượt tra cứu). RLS bật, không policy."
            )
        },
    )

    def __repr__(self) -> str:
        return f"<PatientCondition user_id={self.user_id} code={self.condition_code}>"


class PatientDisease(Base):
    """Một bệnh nền tự khai đã lưu trong hồ sơ người dùng.

    Đây là dữ liệu để hiển thị lại và gợi ý. Nó KHÔNG tự chảy vào request tra cứu;
    người dùng vẫn phải xác nhận bệnh cho lượt hiện tại theo ADR 0017.
    """

    __tablename__ = "patient_diseases"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    disease_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("diseases.id"), nullable=False
    )
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default=SOURCE_SELF_REPORTED)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        CheckConstraint(
            "source IN ('self_reported', 'pharmacist_confirmed')",
            name="ck_patient_diseases_source",
        ),
        UniqueConstraint("user_id", "disease_id", name="uq_patient_diseases_user_disease"),
        {
            "comment": (
                "Bệnh nền tự khai đã lưu theo tài khoản; chỉ gợi ý, không tự đưa vào lượt tra cứu. "
                "RLS bật, không policy."
            )
        },
    )

    def __repr__(self) -> str:
        return f"<PatientDisease user_id={self.user_id} disease_id={self.disease_id}>"
