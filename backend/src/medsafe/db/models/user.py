"""Bảng `users` — tài khoản đăng nhập của Health System X.

Đây KHÔNG phải `auth.users` của Supabase. Dự án không dùng Supabase Auth (GoTrue);
FastAPI tự sở hữu identity để backend là security boundary duy nhất — xem ADR 0015.

★ Bảng nằm trong schema `public` nên PostgREST của Supabase sẽ expose nó cho anon key
  (khoá này nằm công khai trong bundle frontend). Migration bắt buộc bật Row Level
  Security và KHÔNG tạo policy nào; backend kết nối bằng role owner nên vẫn đọc ghi
  bình thường, còn anon/authenticated không thấy một dòng nào. Tắt RLS ở bảng này đồng
  nghĩa với việc công khai toàn bộ hash mật khẩu.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base

# Hai role của sản phẩm, xem specs/user-roles.md. Giữ dạng chuỗi thay vì PostgreSQL ENUM
# vì thêm giá trị vào ENUM cần migration riêng, còn CHECK constraint thì sửa dễ hơn.
ROLE_PATIENT = "PATIENT"
ROLE_PHARMACIST = "PHARMACIST"
ALLOWED_ROLES = (ROLE_PATIENT, ROLE_PHARMACIST)


class User(Base):
    __tablename__ = "users"
    # Phải khớp COMMENT ON TABLE đặt trong revision 0001, nếu không autogenerate sẽ
    # tưởng comment là thừa và sinh lệnh drop_table_comment.
    __table_args__ = {
        "comment": "Tài khoản Health System X. RLS bật, không policy: chỉ backend (role sở hữu) truy cập."
    }

    id: Mapped[uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 320 = 64 (local) + 1 (@) + 255 (domain), giới hạn của RFC 5321.
    # Luôn lưu chữ thường; chuẩn hoá ở domain/auth.normalize_email().
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    # Argon2id encoded hash. Không bao giờ log, không bao giờ đưa vào response schema.
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[str] = mapped_column(String(32), nullable=False, default=ROLE_PATIENT)

    # Vô hiệu hoá tài khoản mà vẫn giữ lịch sử; không xoá cứng.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    def __repr__(self) -> str:
        # Không đưa password_hash vào repr — repr hay lọt vào log và traceback.
        return f"<User id={self.id} email={self.email} role={self.role}>"
