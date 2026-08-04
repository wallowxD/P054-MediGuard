"""Base schema cho toàn bộ I/O của API.

Backend viết snake_case, frontend TypeScript đọc camelCase. Chuyển đổi đặt ở đây một lần
thay vì bắt mỗi service frontend tự map — `accessToken` ở `types/auth.d.ts` phải khớp
đúng field alias sinh ra từ đây, nếu không request path sẽ nhận `undefined` mà không báo
lỗi.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        # Cho phép khởi tạo bằng tên snake_case trong code Python, vẫn serialize ra
        # camelCase vì FastAPI dùng by_alias=True mặc định.
        populate_by_name=True,
        # Đọc thẳng từ ORM model: AuthUserResponse.model_validate(user).
        from_attributes=True,
    )
