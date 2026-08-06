"""Route auth — MỎNG: validate → domain/repository → schema. Không có SQL ở file này.

Năm endpoint, khớp `frontend/src/constants/api.ts`:

| Endpoint                   | Việc                                              |
|----------------------------|----------------------------------------------------|
| `POST /auth/register`      | Tạo tài khoản PATIENT                              |
| `POST /auth/login`         | Đổi email + mật khẩu lấy cặp token                 |
| `POST /auth/google`        | Đổi Google ID Token lấy cặp token — xem ADR 0016   |
| `POST /auth/refresh`       | Đổi refresh token lấy cặp token mới                |
| `GET  /auth/profiles`      | Thông tin user của access token đang dùng          |

★ Argon2 tốn 50–100ms CPU. Gọi thẳng trên coroutine sẽ chặn event loop và làm treo mọi
  request khác trong lúc băm, nên mọi lời gọi hash/verify đều đi qua
  `anyio.to_thread.run_sync`.
"""

from uuid import UUID

import anyio
from fastapi import APIRouter, status

from medsafe.api.dependencies import CurrentUserDep, OAuthIdentityRepositoryDep, SettingsDep, UserRepositoryDep
from medsafe.config import get_auth_config
from medsafe.db.models.oauth_identity import PROVIDER_GOOGLE
from medsafe.db.models.user import ROLE_PATIENT, User
from medsafe.db.repositories.oauth_identity_repository import OAuthIdentityRepository
from medsafe.db.repositories.user_repository import UserRepository
from medsafe.domain.auth import (
    REFRESH_TOKEN_TYPE,
    AuthNotConfiguredError,
    EmailAlreadyRegisteredError,
    GoogleAccountConflictError,
    GoogleIdentity,
    InactiveAccountError,
    InvalidCredentialsError,
    InvalidTokenError,
    TokenPair,
    decode_token,
    hash_password,
    issue_token_pair,
    normalize_email,
    password_needs_rehash,
    validate_password_policy,
    verify_password,
    verify_password_against_dummy,
)
from medsafe.oauth.google_client import verify_google_id_token
from medsafe.schemas.auth import (
    AuthUserResponse,
    GoogleLoginRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
)
from medsafe.schemas.errors import ErrorResponse

router = APIRouter()


def _to_auth_user(user: User) -> AuthUserResponse:
    """Model một role → contract mảng `roles`. Xem ghi chú ở schemas/auth.py."""
    return AuthUserResponse(id=user.id, email=user.email, name=user.name, roles=[user.role])


@router.post(
    "/register",
    response_model=AuthUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Đăng ký tài khoản bệnh nhân",
    responses={
        status.HTTP_400_BAD_REQUEST: {"model": ErrorResponse, "description": "Mật khẩu không đạt yêu cầu"},
        status.HTTP_409_CONFLICT: {"model": ErrorResponse, "description": "Email đã được đăng ký"},
    },
)
async def register(payload: RegisterRequest, repository: UserRepositoryDep) -> AuthUserResponse:
    """Tạo tài khoản mới và trả về hồ sơ, KHÔNG trả token.

    Đăng ký xong client phải gọi tiếp `POST /auth/login` để đăng nhập. Tách hai bước để
    luồng đăng nhập chỉ có một đường đi duy nhất — cũng là chỗ sau này gắn xác thực email
    mà không phải đổi contract.
    """
    auth_config = get_auth_config()
    email = normalize_email(payload.email)

    # Ném PasswordPolicyError trước khi chạm database: không tốn một round-trip cho
    # request chắc chắn hỏng.
    validate_password_policy(payload.password, auth_config.password_min_length)

    if await repository.get_by_email(email) is not None:
        raise EmailAlreadyRegisteredError

    password_hash = await anyio.to_thread.run_sync(hash_password, payload.password)

    user = await repository.create(
        email=email,
        name=payload.name.strip(),
        password_hash=password_hash,
        # Role đến từ config, KHÔNG từ payload — xem ghi chú trong RegisterRequest.
        role=auth_config.self_signup_role,
    )
    return _to_auth_user(user)


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Đăng nhập bằng email và mật khẩu",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse, "description": "Sai email hoặc mật khẩu"},
        status.HTTP_403_FORBIDDEN: {"model": ErrorResponse, "description": "Tài khoản bị vô hiệu hoá"},
    },
)
async def login(
    payload: LoginRequest,
    repository: UserRepositoryDep,
    settings: SettingsDep,
) -> LoginResponse:
    """Trả cặp token kèm hồ sơ user, để client không phải gọi thêm `/auth/profiles`."""
    user = await _user_from_password(
        email=normalize_email(payload.email),
        password=payload.password,
        repository=repository,
    )
    if not user.is_active:
        raise InactiveAccountError

    tokens = _issue_for(user, settings.jwt_secret_key)
    return LoginResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=tokens.expires_in,
        user=_to_auth_user(user),
    )


@router.post(
    "/google",
    response_model=LoginResponse,
    summary="Đăng nhập bằng Google OpenID Connect",
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "model": ErrorResponse,
            "description": "Google ID token không hợp lệ, hết hạn, hoặc email chưa xác thực",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Email đã có tài khoản nhưng chưa liên kết Google",
        },
    },
)
async def login_google(
    payload: GoogleLoginRequest,
    repository: UserRepositoryDep,
    identity_repository: OAuthIdentityRepositoryDep,
    settings: SettingsDep,
) -> LoginResponse:
    """Verify Google ID Token, tìm hoặc tạo user tương ứng, rồi trả cặp token hệ thống.

    Cùng response contract với `/auth/login` — client không cần phân biệt hai luồng sau khi
    đăng nhập xong. Không tự động liên kết khi email trùng local account chưa link, xem
    `GoogleAccountConflictError` và ADR 0016.
    """
    if not settings.google_oauth_client_id:
        raise AuthNotConfiguredError("Server chưa cấu hình GOOGLE_OAUTH_CLIENT_ID.")

    identity = await verify_google_id_token(payload.id_token, settings.google_oauth_client_id)
    user = await _user_from_google_identity(identity, repository, identity_repository)
    if not user.is_active:
        raise InactiveAccountError

    tokens = _issue_for(user, settings.jwt_secret_key)
    return LoginResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=tokens.expires_in,
        user=_to_auth_user(user),
    )


@router.post(
    "/refresh",
    response_model=TokenPairResponse,
    summary="Làm mới cặp token bằng refresh token",
    responses={
        status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse, "description": "Refresh token hỏng hoặc hết hạn"},
        status.HTTP_403_FORBIDDEN: {"model": ErrorResponse, "description": "Tài khoản bị vô hiệu hoá"},
    },
)
async def refresh(
    payload: RefreshRequest,
    repository: UserRepositoryDep,
    settings: SettingsDep,
) -> TokenPairResponse:
    """Chỉ nhận token loại `refresh`.

    Access token gửi vào đây bị từ chối 401: refresh token sống 14 ngày còn access token
    sống 30 phút, chấp nhận nhầm loại là kéo dài vòng đời token bị lộ lên gấp hàng trăm
    lần. Kiểm tra nằm ở `domain.auth.decode_token(expected_type=...)`.
    """
    user = await _user_from_refresh_token(payload.refresh_token, repository, settings.jwt_secret_key)
    if not user.is_active:
        raise InactiveAccountError

    tokens = _issue_for(user, settings.jwt_secret_key)
    return TokenPairResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        expires_in=tokens.expires_in,
    )


@router.get(
    "/profiles",
    response_model=AuthUserResponse,
    summary="Hồ sơ của user đang đăng nhập",
    responses={status.HTTP_401_UNAUTHORIZED: {"model": ErrorResponse}},
)
async def get_profile(current_user: CurrentUserDep) -> AuthUserResponse:
    return _to_auth_user(current_user)


def _issue_for(user: User, secret_key: str) -> TokenPair:
    """Phát cặp token cho user. Dùng chung giữa `/login` và `/refresh`.

    Hai endpoint phải phát token bằng cùng một tham số — nếu mỗi chỗ tự đọc config riêng,
    một lần sửa TTL sẽ chỉ có tác dụng ở một luồng.
    """
    auth_config = get_auth_config()
    return issue_token_pair(
        subject=str(user.id),
        email=user.email,
        roles=[user.role],
        secret_key=secret_key,
        algorithm=auth_config.algorithm,
        access_ttl_minutes=auth_config.access_token_ttl_minutes,
        refresh_ttl_days=auth_config.refresh_token_ttl_days,
    )


async def _user_from_password(*, email: str, password: str, repository: UserRepository) -> User:
    user = await repository.get_by_email(email)

    if user is None or user.password_hash is None:
        # `password_hash is None` = tài khoản chỉ đăng nhập Google (ADR 0016). Trả lỗi
        # giống hệt "email không tồn tại" — không để lộ việc email này gắn với Google.
        # Vẫn phải băm một lần: trả lời ngay lập tức sẽ để lộ email nào đã có tài khoản
        # qua thời gian phản hồi.
        await anyio.to_thread.run_sync(verify_password_against_dummy, password)
        raise InvalidCredentialsError

    is_valid = await anyio.to_thread.run_sync(verify_password, password, user.password_hash)
    if not is_valid:
        raise InvalidCredentialsError

    # Nâng work factor dần: khi tham số Argon2 mặc định tăng ở phiên bản thư viện mới,
    # hash cũ được ghi đè ngay lần đăng nhập kế tiếp thay vì nằm yếu mãi mãi.
    if password_needs_rehash(user.password_hash):
        new_hash = await anyio.to_thread.run_sync(hash_password, password)
        await repository.update_password_hash(user, new_hash)

    return user


async def _user_from_google_identity(
    identity: GoogleIdentity,
    repository: UserRepository,
    identity_repository: OAuthIdentityRepository,
) -> User:
    """Tìm user theo `(provider, sub)` đã link; nếu chưa, tạo mới hoặc từ chối trùng email.

    `sub` là khoá liên kết chính — KHÔNG dùng `email` để tra trước, vì email có thể đổi chủ
    phía Google. Chỉ khi chưa có liên kết nào mới xét tới email, và khi đó CHỈ để phát hiện
    xung đột chứ không bao giờ tự động liên kết — xem ADR 0016.
    """
    existing_identity = await identity_repository.get_by_provider_subject(PROVIDER_GOOGLE, identity.subject)
    if existing_identity is not None:
        user = await repository.get_by_id(existing_identity.user_id)
        if user is None:
            # Liên kết trỏ tới user đã bị xoá — coi như token không dùng được, không lộ
            # chi tiết nội bộ (tương tự _user_from_refresh_token).
            raise InvalidTokenError
        return user

    existing_by_email = await repository.get_by_email(identity.email)
    if existing_by_email is not None:
        raise GoogleAccountConflictError

    user = await repository.create(
        email=identity.email,
        name=identity.name or identity.email,
        password_hash=None,
        role=ROLE_PATIENT,
    )
    await identity_repository.create(
        user_id=user.id,
        provider=PROVIDER_GOOGLE,
        provider_subject=identity.subject,
        provider_email=identity.email,
    )
    return user


async def _user_from_refresh_token(token: str, repository: UserRepository, secret_key: str) -> User:
    auth_config = get_auth_config()
    claims = decode_token(
        token,
        secret_key=secret_key,
        algorithm=auth_config.algorithm,
        expected_type=REFRESH_TOKEN_TYPE,
    )

    try:
        user_id = UUID(claims.subject)
    except ValueError as exc:
        raise InvalidTokenError from exc

    user = await repository.get_by_id(user_id)
    if user is None:
        raise InvalidTokenError

    return user
