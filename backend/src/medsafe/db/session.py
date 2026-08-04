"""Engine và session bất đồng bộ cho request path.

Engine được tạo lười (lazy) và cache lại: import module này không được phép mở kết nối,
nếu không thì mọi unit test và cả `--help` của CLI đều đòi DATABASE_URL.
"""

from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from medsafe.config import get_settings


def _to_async_url(database_url: str) -> str:
    """Ép DATABASE_URL về driver bất đồng bộ.

    Supabase đưa connection string dạng `postgresql://...`, tức driver đồng bộ mặc định.
    Dùng thẳng chuỗi đó với `create_async_engine` sẽ ném InvalidRequestError. Chuyển sang
    psycopg3 (đã có trong dependency, dùng chung cho cả Alembic đồng bộ).
    """
    if database_url.startswith("postgresql+"):
        return database_url
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    raise ValueError(
        f"DATABASE_URL phải là PostgreSQL, nhận được: {database_url!r}. "
        "Lấy 'Session pooler' URI trong Supabase → Project Settings → Database."
    )


def _connect_args(url: str) -> dict[str, object]:
    """Tắt prepared statement khi dùng transaction pooler của Supabase.

    Supabase có hai pooler: session (cổng 5432) và transaction (cổng 6543). Cổng 6543
    ghép nhiều client vào chung một connection nên prepared statement do psycopg tạo ở
    request này có thể biến mất ở request sau — lỗi hiện ra dưới dạng
    `InvalidSqlStatementName` hoặc `DuplicatePreparedStatement`, chỉ xảy ra khi có tải
    và rất khó lần ra. Dự án nên dùng cổng 5432; đây là lưới an toàn cho ai lỡ dán
    nhầm chuỗi 6543 từ dashboard.
    """
    if make_url(url).port == 6543:
        return {"prepare_threshold": None}
    return {}


@lru_cache
def get_engine() -> AsyncEngine:
    settings = get_settings()
    async_url = _to_async_url(settings.database_url)
    return create_async_engine(
        async_url,
        connect_args=_connect_args(async_url),
        # Supabase pooler đóng connection nhàn rỗi. Không có pre_ping thì request đầu
        # tiên sau một lúc im lặng sẽ chết vì "server closed the connection".
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_recycle=1800,
        echo=settings.app_env == "development" and settings.log_level == "DEBUG",
    )


@lru_cache
def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(
        bind=get_engine(),
        expire_on_commit=False,  # route đọc thuộc tính model SAU commit
        autoflush=False,
    )


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency: một session cho một request, rollback khi có exception."""
    async with get_sessionmaker()() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    """Đóng connection pool lúc shutdown; gọi từ lifespan trong main.py."""
    if get_engine.cache_info().currsize:
        await get_engine().dispose()
