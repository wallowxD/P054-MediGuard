"""Điểm import tập trung của ORM model.

Alembic autogenerate chỉ thấy model nào đã được import ở đây. Thêm model mới mà quên
dòng import tương ứng sẽ khiến migration sinh ra lệnh xoá bảng.
"""

from medsafe.db.models.user import ALLOWED_ROLES, ROLE_PATIENT, ROLE_PHARMACIST, User

__all__ = ["ALLOWED_ROLES", "ROLE_PATIENT", "ROLE_PHARMACIST", "User"]
