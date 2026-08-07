"""Dependency dùng chung cho tầng API.

Route nhận repository qua dependency chứ không tự dựng — nhờ vậy integration test
override `get_user_repository` bằng một implementation in-memory và chạy được không cần
database, đúng quy tắc "unit/ không chạm mạng" trong docs/backend.md.
"""

from typing import Annotated
from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.config import Settings, get_auth_config, get_settings
from medsafe.db.models.user import User
from medsafe.db.repositories.oauth_identity_repository import OAuthIdentityRepository, SqlOAuthIdentityRepository
from medsafe.db.repositories.user_repository import SqlUserRepository, UserRepository
from medsafe.db.session import get_session
from medsafe.domain.auth import ACCESS_TOKEN_TYPE, InactiveAccountError, InvalidTokenError, decode_token

SettingsDep = Annotated[Settings, Depends(get_settings)]
SessionDep = Annotated[AsyncSession, Depends(get_session)]

# auto_error=False: mặc định HTTPBearer trả 403 cho request thiếu header, còn contract
# của ta là 401 kèm typed error body. Tự xử lý để hình dạng lỗi đồng nhất.
_bearer_scheme = HTTPBearer(auto_error=False)
BearerDep = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)]


def get_user_repository(session: SessionDep) -> UserRepository:
    return SqlUserRepository(session)


UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]


def get_oauth_identity_repository(session: SessionDep) -> OAuthIdentityRepository:
    return SqlOAuthIdentityRepository(session)


OAuthIdentityRepositoryDep = Annotated[OAuthIdentityRepository, Depends(get_oauth_identity_repository)]


async def get_current_user(
    credentials: BearerDep,
    repository: UserRepositoryDep,
    settings: SettingsDep,
) -> User:
    """Giải mã access token và nạp user tương ứng.

    Backend là security boundary thật (ADR 0007): proxy của Next.js chỉ chặn UX, mọi
    endpoint cần đăng nhập đều phải đi qua dependency này.
    """
    if credentials is None or not credentials.credentials:
        raise InvalidTokenError("Thiếu access token.")

    auth_config = get_auth_config()
    claims = decode_token(
        credentials.credentials,
        secret_key=settings.jwt_secret_key,
        algorithm=auth_config.algorithm,
        expected_type=ACCESS_TOKEN_TYPE,
    )

    try:
        user_id = UUID(claims.subject)
    except ValueError as exc:
        raise InvalidTokenError from exc

    user = await repository.get_by_id(user_id)
    if user is None:
        # Token ký hợp lệ nhưng user đã bị xoá — vẫn là token không dùng được.
        raise InvalidTokenError
    if not user.is_active:
        raise InactiveAccountError

    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]
