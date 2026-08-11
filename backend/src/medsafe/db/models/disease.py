"""Bảng `diseases` — danh mục bệnh nền được duyệt, phục vụ ô gợi ý ở màn tra cứu.

Đừng nhầm với `patient_conditions`: bảng đó lưu tình trạng đặc biệt của HỒ SƠ (4 giá trị
cố định, lưu lâu dài theo tài khoản), còn bảng này là danh mục bệnh nền mà người dùng
chọn lại ở TỪNG LƯỢT tra cứu.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Text, UniqueConstraint, func, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base


class Disease(Base):
    """Một bệnh nền trong danh mục được duyệt.

    ★ `name_unaccent` phải dùng ĐÚNG công thức mà `disease_repository.py` áp cho
      `drug_disease_interactions.disease_name_unaccent`:

          remove_vietnamese_accents(name).lower().strip()

      Hai bên lệch nhau thì exact lookup theo cặp (hoạt chất, bệnh) không join được:
      người dùng chọn một bệnh có thật trong danh mục nhưng vẫn nhận "chưa có dữ liệu".

    Danh mục là TẬP ĐÓNG do đội duyệt — người dùng chọn từ gợi ý, không tự tạo bệnh mới.
    Tên bệnh tự do sẽ không bao giờ khớp được với một bản ghi có evidence.
    """

    __tablename__ = "diseases"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    name_unaccent: Mapped[str] = mapped_column(Text, nullable=False)

    # Bỏ một bệnh khỏi gợi ý mà vẫn giữ được các bản ghi trỏ tới nó; không xoá cứng.
    # `text("true")` chứ không `func.true()`: cái sau compile thành `DEFAULT true()`, sai
    # cú pháp PostgreSQL và lệch với `sa.text("true")` mà revision 0005 đã dùng.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("name_unaccent", name="uq_diseases_name_unaccent"),
        # Phải khớp COMMENT ON TABLE trong revision 0005, nếu không autogenerate sẽ sinh
        # lệnh drop_table_comment.
        {"comment": "Danh mục bệnh nền được duyệt, dùng cho ô gợi ý ở màn tra cứu."},
    )

    def __repr__(self) -> str:
        return f"<Disease {self.name!r} active={self.is_active}>"
