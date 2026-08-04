"""Central error handler — đổi exception của domain thành HTTP status + typed body.

Quy ước code style cấm bare `except:` và cấm route tự dựng dict lỗi. Domain ném exception
mang ngữ nghĩa (`InvalidCredentialsError`, `EmailAlreadyRegisteredError`…), còn việc chọn
status code là quyết định của tầng HTTP và chỉ nằm ở đây.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from medsafe.domain.auth import (
    AuthError,
    AuthNotConfiguredError,
    EmailAlreadyRegisteredError,
    InactiveAccountError,
    InvalidCredentialsError,
    InvalidTokenError,
    PasswordPolicyError,
)
from medsafe.schemas.errors import ErrorResponse

# Sai email và sai mật khẩu dùng chung 401 + chung message: phân biệt hai trường hợp này
# biến endpoint đăng nhập thành công cụ dò xem email nào đã có tài khoản.
_STATUS_BY_ERROR: dict[type[AuthError], int] = {
    PasswordPolicyError: status.HTTP_400_BAD_REQUEST,
    EmailAlreadyRegisteredError: status.HTTP_409_CONFLICT,
    InvalidCredentialsError: status.HTTP_401_UNAUTHORIZED,
    InvalidTokenError: status.HTTP_401_UNAUTHORIZED,
    InactiveAccountError: status.HTTP_403_FORBIDDEN,
    AuthNotConfiguredError: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


def _status_for(error: AuthError) -> int:
    for error_type, http_status in _STATUS_BY_ERROR.items():
        if isinstance(error, error_type):
            return http_status
    return status.HTTP_400_BAD_REQUEST


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AuthError)
    async def handle_auth_error(_: Request, exc: AuthError) -> JSONResponse:
        http_status = _status_for(exc)
        # Lỗi cấu hình server không được lộ chi tiết ra ngoài; log giữ nguyên exception.
        message = "Lỗi cấu hình server." if isinstance(exc, AuthNotConfiguredError) else exc.message

        return JSONResponse(
            status_code=http_status,
            content=ErrorResponse(code=exc.code, message=message).model_dump(by_alias=True),
            # RFC 9110: 401 bắt buộc kèm WWW-Authenticate, thiếu header này một số HTTP
            # client sẽ không kích hoạt luồng refresh token.
            headers={"WWW-Authenticate": "Bearer"} if http_status == status.HTTP_401_UNAUTHORIZED else None,
        )
