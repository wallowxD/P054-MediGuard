"""Toàn bộ SQL liên quan tới `oauth_identities`. Không viết query ở route hay ở domain.

Protocol `OAuthIdentityRepository` là ranh giới để `api/v1/auth.py` không phụ thuộc
SQLAlchemy — cùng pattern với `UserRepository`, xem `db/repositories/user_repository.py`.
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.oauth_identity import OAuthIdentity


class OAuthIdentityRepository(Protocol):
    """Cổng truy cập dữ liệu liên kết OAuth mà tầng API được phép biết tới."""

    async def get_by_provider_subject(self, provider: str, provider_subject: str) -> OAuthIdentity | None: ...

    async def create(
        self, *, user_id: UUID, provider: str, provider_subject: str, provider_email: str | None
    ) -> OAuthIdentity: ...


class SqlOAuthIdentityRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_provider_subject(self, provider: str, provider_subject: str) -> OAuthIdentity | None:
        result = await self._session.execute(
            select(OAuthIdentity).where(
                OAuthIdentity.provider == provider,
                OAuthIdentity.provider_subject == provider_subject,
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self, *, user_id: UUID, provider: str, provider_subject: str, provider_email: str | None
    ) -> OAuthIdentity:
        identity = OAuthIdentity(
            user_id=user_id,
            provider=provider,
            provider_subject=provider_subject,
            provider_email=provider_email,
        )
        self._session.add(identity)
        await self._session.commit()
        await self._session.refresh(identity)
        return identity
