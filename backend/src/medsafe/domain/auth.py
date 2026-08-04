"""Logic auth THUẦN: không import fastapi, sqlalchemy hay bất kỳ provider SDK nào.

Toàn bộ file này chạy được trong `tests/unit/domain/` mà không cần database, không cần
mạng — đó là lý do hash password và ký JWT nằm ở đây thay vì nằm trong route.

Ba quyết định đáng chú ý:

1. **Argon2id, không phải bcrypt/sha256.** bcrypt cắt cụt mật khẩu ở byte thứ 72 (im lặng)
   và sha256 không có work factor. Không tự viết hàm hash.
2. **So sánh mật khẩu luôn tốn thời gian như nhau.** Khi email không tồn tại, route vẫn
   phải gọi `verify_password_against_dummy()`; trả lời sớm sẽ để lộ email nào đã đăng ký
   qua chênh lệch thời gian phản hồi.
3. **Token là stateless.** Không có bảng revoke: logout chỉ xoá token phía client, và
   refresh token cũ vẫn hợp lệ tới khi hết hạn. Đây là giới hạn đã biết, xem ADR 0015.
"""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error, InvalidHashError

# Một instance dùng chung: khởi tạo PasswordHasher không rẻ và tham số phải đồng nhất
# trên toàn hệ thống, nếu không hash sinh ra ở hai nơi sẽ có work factor khác nhau.
_hasher = PasswordHasher()

# Hash của một mật khẩu ngẫu nhiên không ai biết. Chỉ dùng để đốt đúng lượng CPU khi
# email không tồn tại — xem `verify_password_against_dummy()`.
_DUMMY_HASH = _hasher.hash("dummy-password-for-constant-time-comparison")

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


class AuthError(Exception):
    """Base cho mọi lỗi auth. `code` đi thẳng vào error body, xem schemas/errors.py."""

    code = "auth_error"
    message = "Yêu cầu xác thực không hợp lệ."

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)
        self.message = message or self.message


class AuthNotConfiguredError(AuthError):
    """Thiếu JWT_SECRET_KEY. Lỗi cấu hình phía server, không phải lỗi của client."""

    code = "auth_not_configured"
    message = "Server chưa cấu hình JWT_SECRET_KEY."


class PasswordPolicyError(AuthError):
    code = "password_policy_violation"
    message = "Mật khẩu không đạt yêu cầu."


class EmailAlreadyRegisteredError(AuthError):
    code = "email_already_registered"
    message = "Email này đã được đăng ký."


class InvalidCredentialsError(AuthError):
    """Dùng chung cho sai email và sai mật khẩu — không tiết lộ email nào tồn tại."""

    code = "invalid_credentials"
    message = "Email hoặc mật khẩu không đúng."


class InvalidTokenError(AuthError):
    code = "invalid_token"
    message = "Token không hợp lệ hoặc đã hết hạn."


class InactiveAccountError(AuthError):
    code = "account_inactive"
    message = "Tài khoản đã bị vô hiệu hoá."


@dataclass(frozen=True)
class TokenClaims:
    """Nội dung đã xác minh của một JWT."""

    subject: str
    email: str
    roles: list[str]
    token_type: str
    expires_at: datetime


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    expires_in: int  # giây còn lại của access token, để client tự lên lịch refresh


def normalize_email(raw_email: str) -> str:
    """Chuẩn hoá email trước khi ghi hoặc tra cứu.

    Email không phân biệt hoa thường ở phần domain, và thực tế mọi provider phổ biến
    cũng không phân biệt ở phần local. Nếu không hạ về chữ thường tại đây thì
    "Quang@gmail.com" và "quang@gmail.com" sẽ tạo ra hai tài khoản khác nhau dù unique
    index vẫn báo hợp lệ.
    """
    return raw_email.strip().lower()


def validate_password_policy(password: str, min_length: int) -> None:
    """Kiểm tra mật khẩu; ném `PasswordPolicyError` với thông điệp đọc được cho người dùng.

    Cố ý giữ luật đơn giản: đủ dài, có chữ và có số. Ép thêm ký tự đặc biệt thường khiến
    người dùng chọn mật khẩu dễ đoán hơn chứ không an toàn hơn.
    """
    if len(password) < min_length:
        raise PasswordPolicyError(f"Mật khẩu phải có ít nhất {min_length} ký tự.")
    if not any(c.isalpha() for c in password):
        raise PasswordPolicyError("Mật khẩu phải có ít nhất một chữ cái.")
    if not any(c.isdigit() for c in password):
        raise PasswordPolicyError("Mật khẩu phải có ít nhất một chữ số.")


def hash_password(password: str) -> str:
    """Băm mật khẩu bằng Argon2id.

    Tốn khoảng 50–100ms CPU theo thiết kế. Trên request path phải gọi qua
    `anyio.to_thread.run_sync` để không chặn event loop — xem `api/v1/auth.py`.
    """
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """So khớp mật khẩu với hash. Trả về False thay vì ném lỗi khi không khớp."""
    try:
        return _hasher.verify(password_hash, password)
    except (Argon2Error, InvalidHashError):
        return False


def verify_password_against_dummy(password: str) -> bool:
    """Đốt đúng lượng CPU của một lần verify khi email không tồn tại.

    Luôn trả về False. Bỏ bước này thì thời gian phản hồi của "email không tồn tại"
    ngắn hơn hẳn "sai mật khẩu", và đó là một oracle liệt kê tài khoản.
    """
    verify_password(password, _DUMMY_HASH)
    return False


def password_needs_rehash(password_hash: str) -> bool:
    """True khi hash được tạo bằng tham số Argon2 cũ hơn tham số hiện tại.

    Cho phép nâng work factor dần: lần đăng nhập kế tiếp sẽ ghi đè hash mới.
    """
    try:
        return _hasher.check_needs_rehash(password_hash)
    except InvalidHashError:
        return True


def _encode(
    *,
    subject: str,
    email: str,
    roles: list[str],
    token_type: str,
    secret_key: str,
    algorithm: str,
    lifetime: timedelta,
    issued_at: datetime,
) -> str:
    expires_at = issued_at + lifetime
    payload = {
        "sub": subject,
        "email": email,
        "roles": roles,
        "typ": token_type,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        # jti làm hai token phát ra trong cùng một giây vẫn khác nhau, và là chỗ móc
        # sẵn cho revocation list sau này.
        "jti": uuid4().hex,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def issue_token_pair(
    *,
    subject: str,
    email: str,
    roles: list[str],
    secret_key: str,
    algorithm: str,
    access_ttl_minutes: int,
    refresh_ttl_days: int,
    issued_at: datetime | None = None,
) -> TokenPair:
    """Phát cặp access/refresh token.

    `issued_at` để test bơm thời điểm cố định; production luôn để None.
    """
    if not secret_key:
        raise AuthNotConfiguredError

    now = issued_at or datetime.now(UTC)
    access_lifetime = timedelta(minutes=access_ttl_minutes)

    return TokenPair(
        access_token=_encode(
            subject=subject,
            email=email,
            roles=roles,
            token_type=ACCESS_TOKEN_TYPE,
            secret_key=secret_key,
            algorithm=algorithm,
            lifetime=access_lifetime,
            issued_at=now,
        ),
        refresh_token=_encode(
            subject=subject,
            email=email,
            roles=roles,
            token_type=REFRESH_TOKEN_TYPE,
            secret_key=secret_key,
            algorithm=algorithm,
            lifetime=timedelta(days=refresh_ttl_days),
            issued_at=now,
        ),
        expires_in=int(access_lifetime.total_seconds()),
    )


def decode_token(
    token: str,
    *,
    secret_key: str,
    algorithm: str,
    expected_type: str,
) -> TokenClaims:
    """Xác minh chữ ký, hạn dùng và LOẠI token.

    Kiểm tra `typ` là bắt buộc: refresh token sống lâu hơn access token rất nhiều, nếu
    nhận nó như access token thì một token bị lộ sẽ dùng được hàng tuần.
    """
    if not secret_key:
        raise AuthNotConfiguredError

    try:
        payload = jwt.decode(
            token,
            secret_key,
            algorithms=[algorithm],
            options={"require": ["sub", "exp", "iat", "typ"]},
        )
    except jwt.PyJWTError as exc:
        raise InvalidTokenError from exc

    if payload.get("typ") != expected_type:
        raise InvalidTokenError(f"Cần token loại '{expected_type}'.")

    return TokenClaims(
        subject=str(payload["sub"]),
        email=str(payload.get("email", "")),
        roles=list(payload.get("roles", [])),
        token_type=str(payload["typ"]),
        expires_at=datetime.fromtimestamp(payload["exp"], tz=UTC),
    )
