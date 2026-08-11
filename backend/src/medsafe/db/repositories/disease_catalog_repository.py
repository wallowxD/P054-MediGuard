"""Toàn bộ SQL liên quan tới bảng `diseases` — danh mục bệnh nền cho ô gợi ý.

Đừng nhầm với `disease_repository.py`: file đó truy vấn `drug_disease_interactions` (bản
ghi tương tác thuốc–bệnh kèm trích dẫn), còn file này chỉ phục vụ danh mục tên bệnh.
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.disease import Disease
from medsafe.domain.normalization import normalize_disease_name


class DiseaseCatalogRepository(Protocol):
    """Cổng truy cập danh mục bệnh nền mà tầng API được phép biết tới."""

    async def list_active(self) -> list[Disease]: ...

    async def search(self, query: str, *, limit: int = 10) -> list[Disease]: ...

    async def get_by_id(self, disease_id: UUID) -> Disease | None: ...

    async def find_by_names(self, names: list[str]) -> list[Disease]: ...


class SqlDiseaseCatalogRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_active(self) -> list[Disease]:
        result = await self._session.execute(
            select(Disease).where(Disease.is_active.is_(True)).order_by(Disease.name_unaccent)
        )
        return list(result.scalars().all())

    async def search(self, query: str, *, limit: int = 10) -> list[Disease]:
        """Gợi ý theo chuỗi người dùng gõ; gõ không dấu vẫn ra tên có dấu (AC US3.2).

        `autoescape=True` là bắt buộc: không có nó thì `%` hay `_` người dùng gõ trở
        thành ký tự đại diện của LIKE và ô gợi ý trả về cả danh mục.

        Danh mục hiện là tập đóng cỡ chục dòng nên sắp xếp theo tên là đủ; không cần
        xếp hạng khớp tiền tố như `domain/normalization.search_catalog` làm với thuốc.
        """
        needle = normalize_disease_name(query)
        if not needle:
            return []

        result = await self._session.execute(
            select(Disease)
            .where(Disease.is_active.is_(True), Disease.name_unaccent.contains(needle, autoescape=True))
            .order_by(Disease.name_unaccent)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_id(self, disease_id: UUID) -> Disease | None:
        return await self._session.get(Disease, disease_id)

    async def find_by_names(self, names: list[str]) -> list[Disease]:
        """Khớp CHÍNH XÁC danh sách tên bệnh của một lượt tra cứu với danh mục.

        Dùng để chặn text tự do trước khi vào exact lookup: tên nào không có trong danh
        mục thì không xuất hiện trong kết quả, và tầng trên báo lỗi thay vì đoán một bệnh
        gần nghĩa. `contains` của hàm `search` KHÔNG dùng được ở đây — khớp chuỗi con sẽ
        biến "suy gan" thành ứng viên cho một tên bệnh khác chứa cụm đó.
        """
        needles = {normalize_disease_name(name) for name in names if normalize_disease_name(name)}
        if not needles:
            return []

        result = await self._session.execute(
            select(Disease).where(Disease.is_active.is_(True), Disease.name_unaccent.in_(needles))
        )
        return list(result.scalars().all())
