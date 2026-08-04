"""Error body có kiểu, theo ADR 0011.

ADR 0011 bỏ envelope `{error, message, data}` cho response thành công, nhưng lỗi vẫn cần
một hình dạng cố định để frontend hiển thị đúng thông điệp. `code` là hằng số máy đọc
(khớp `AuthError.code`), `message` là câu tiếng Việt hiển thị cho người dùng.
"""

from medsafe.schemas.base import CamelModel


class ErrorResponse(CamelModel):
    code: str
    message: str
