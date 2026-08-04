"""Môi trường chạy migration.

Alembic dùng driver ĐỒNG BỘ (psycopg3 sync), khác với request path dùng AsyncSession.
Cố tình như vậy: migration là job một lần, không cần async, và env.py đồng bộ thì ngắn
hơn và ít chỗ hỏng hơn hẳn.

URL kết nối lấy từ `.env` ở repo root qua `medsafe.config`, không nằm trong alembic.ini —
alembic.ini được commit, .env thì không.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import này có tác dụng phụ bắt buộc: nạp mọi ORM model vào Base.metadata.
# Thiếu nó, `--autogenerate` sẽ thấy metadata rỗng và sinh ra lệnh DROP TABLE.
import medsafe.db.models  # noqa: F401
from medsafe.config import get_settings
from medsafe.db.base import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _database_url() -> str:
    """URL đồng bộ cho Alembic.

    ConfigParser hiểu `%` là ký tự nội suy, mà mật khẩu Supabase hoàn toàn có thể chứa
    `%`. Không escape thì alembic chết với InterpolationSyntaxError và thông báo lỗi
    không hề nhắc tới mật khẩu.
    """
    url = get_settings().database_url
    # psycopg chạy được cả hai chiều; bỏ hậu tố async nếu ai đó đặt asyncpg.
    url = url.replace("+asyncpg", "+psycopg")
    return url.replace("%", "%%")


config.set_main_option("sqlalchemy.url", _database_url())

target_metadata = Base.metadata


def include_object(
    obj: object,
    name: str | None,
    type_: str,
    reflected: bool,
    compare_to: object | None,
) -> bool:
    """★ Chặn autogenerate xoá bảng chưa được model hoá.

    Mặc định Alembic coi "có trong database nhưng không có trong metadata" là thừa và
    sinh `op.drop_table(...)`. Trên project này, bảng hay được tạo tay bằng Supabase SQL
    Editor trước khi có ORM model — chạy nhầm một migration như vậy là mất dữ liệu thật.

    Bốn bảng catalog/tương tác nay đã có model trong `db/models/` (revision 0002), nhưng
    guard vẫn giữ lại vì thói quen tạo bảng tay chưa thay đổi. Hệ quả cần biết: muốn xoá
    một bảng thì phải viết `op.drop_table(...)` bằng tay, autogenerate sẽ không tự sinh.
    """
    if type_ == "table" and reflected and compare_to is None:
        return False
    return True


def run_migrations_offline() -> None:
    """Sinh SQL ra stdout mà không kết nối database (`alembic upgrade head --sql`)."""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            # Bắt cả thay đổi kiểu cột, không chỉ thêm/bớt cột.
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
