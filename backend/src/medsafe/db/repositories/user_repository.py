"""Toàn bộ SQL liên quan tới `users`. Không viết query ở route hay ở domain.

Protocol `UserRepository` là ranh giới để `api/v1/auth.py` không phụ thuộc SQLAlchemy;
integration test override dependency bằng một implementation in-memory nên chạy được
mà không cần database thật.
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.user import User
from medsafe.domain.auth import EmailAlreadyRegisteredError


class UserRepository(Protocol):
    """Cổng truy cập dữ liệu user mà tầng API được phép biết tới."""

    async def get_by_email(self, email: str) -> User | None: ...

    async def get_by_id(self, user_id: UUID) -> User | None: ...

    async def create(self, *, email: str, name: str, password_hash: str | None, role: str) -> User: ...

    async def update_password_hash(self, user: User, password_hash: str) -> None: ...


class SqlUserRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_email(self, email: str) -> User | None:
        """Tra theo email đã chuẩn hoá chữ thường — xem domain.auth.normalize_email()."""
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self._session.get(User, user_id)

    async def create(self, *, email: str, name: str, password_hash: str | None, role: str) -> User:
        """Tạo user mới. `password_hash=None` cho tài khoản chỉ đăng nhập Google (ADR 0016).

        Kiểm tra trùng email ở route chỉ để có thông báo thân thiện; bảo đảm THẬT nằm ở
        unique index dưới database. Hai request tạo tài khoản cùng email gửi song song sẽ
        cùng qua được bước kiểm tra, và bản ghi thứ hai chết ở đây.
        """
        user = User(email=email, name=name, password_hash=password_hash, role=role)
        self._session.add(user)
        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            # `users` chỉ có duy nhất một unique constraint là email, nên mọi
            # IntegrityError ở đây đều là trùng email.
            raise EmailAlreadyRegisteredError from exc
        await self._session.refresh(user)
        return user

    async def update_password_hash(self, user: User, password_hash: str) -> None:
        user.password_hash = password_hash
        await self._session.commit()
