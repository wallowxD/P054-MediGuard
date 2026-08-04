"""Request/response của auth. Nguồn sinh OpenAPI → `frontend/src/lib/api/types.gen.ts`.

Hình dạng ở đây phải khớp `frontend/src/types/auth.d.ts` đang có sẵn:
`IRegisterRequest`, `IAuthUser`, `ILoginRequest`, `ILoginResponse`, `IRefreshTokenRequest`.
Đổi field ở đây mà không sinh lại type frontend là contract drift.
"""

from uuid import UUID

from pydantic import EmailStr, Field

from medsafe.schemas.base import CamelModel

# Chặn payload khổng lồ: Argon2 băm cả chuỗi, một mật khẩu 1MB là một request tốn CPU.
# Đây là giới hạn an toàn hạ tầng, khác với password_min_length trong config.yaml —
# độ dài tối thiểu là chính sách sản phẩm nên được kiểm ở domain/auth.py.
MAX_PASSWORD_LENGTH = 128


class RegisterRequest(CamelModel):
    """Khớp `IRegisterRequest`.

    KHÔNG có field `role`: đăng ký công khai luôn tạo PATIENT. Cho client tự chọn role
    đồng nghĩa với việc ai cũng tự cấp quyền dược sĩ và vào được `/review/**`.
    """

    email: EmailStr
    password: str = Field(max_length=MAX_PASSWORD_LENGTH)
    name: str = Field(min_length=1, max_length=120)


class AuthUserResponse(CamelModel):
    """Khớp `IAuthUser`. Tuyệt đối không thêm `password_hash` vào đây."""

    id: UUID
    email: EmailStr
    name: str
    # Database lưu một role trên mỗi user, nhưng contract frontend đã duyệt dùng mảng
    # (`roles: string[]`) để middleware kiểm tra quyền bằng includes(). Giữ nguyên mảng.
    roles: list[str]


class LoginRequest(CamelModel):
    """Khớp `ILoginRequest` — body của `POST /api/v1/auth/login`."""

    email: EmailStr
    password: str = Field(max_length=MAX_PASSWORD_LENGTH)


class RefreshRequest(CamelModel):
    """Khớp `IRefreshTokenRequest` — body của `POST /api/v1/auth/refresh`."""

    refresh_token: str = Field(min_length=1)


class TokenPairResponse(CamelModel):
    """Cặp token mới. Khớp `IRefreshTokenResponse`, thêm `expiresIn`.

    `expires_in` là số giây còn lại của access token, để client tự lên lịch gọi refresh
    trước khi hết hạn thay vì phải đợi một request 401 rồi mới thử lại.
    """

    access_token: str
    refresh_token: str
    expires_in: int


class LoginResponse(TokenPairResponse):
    """Khớp `ILoginResponse`.

    Trả kèm `user` để client không phải gọi thêm `GET /auth/profiles` ngay sau khi đăng
    nhập. Endpoint refresh KHÔNG trả `user`: lúc đó client đã có hồ sơ rồi, và giữ hai
    response model tách bạch làm OpenAPI mô tả đúng từng luồng.
    """

    user: AuthUserResponse
