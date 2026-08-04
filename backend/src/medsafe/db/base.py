"""Declarative base dùng chung cho mọi ORM model.

Alembic autogenerate so sánh `Base.metadata` với schema thật, nên model nào không được
import vào `db/models/__init__.py` sẽ bị Alembic coi như không tồn tại và migration sẽ
âm thầm sinh ra lệnh DROP TABLE.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
