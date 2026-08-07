"""Toàn bộ SQL liên quan tới `drugs`. Không viết query ở route hay ở domain.

Protocol `DrugRepository` là ranh giới để tầng API/Domain không phụ thuộc SQLAlchemy trực tiếp;
unit test override dependency bằng một implementation in-memory nên chạy được mà không cần database thật.
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.drug import Drug
from medsafe.domain.pairing import MAX_DRUGS_PER_CHECK


class DrugRepository(Protocol):
    """Cổng truy cập dữ liệu danh mục thuốc."""

    async def list_catalog_pairs(self) -> list[tuple[UUID, str, str]]: ...

    async def get_by_id(self, drug_id: UUID) -> Drug | None: ...

    async def get_by_ids(self, drug_ids: list[UUID]) -> list[Drug]: ...


class SqlDrugRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_catalog_pairs(self) -> list[tuple[UUID, str, str]]:
        """Trả danh sách tuple (id, brand_name, ingredient_raw) của tất cả thuốc trong danh mục.

        Phục vụ cho `domain/normalization.py` match_drug() và giúp API search gán drugId ổn định.
        """
        stmt = select(Drug.id, Drug.brand_name, Drug.ingredient_raw)
        result = await self._session.execute(stmt)
        return [(row[0], row[1], row[2]) for row in result.all()]

    async def get_by_id(self, drug_id: UUID) -> Drug | None:
        return await self._session.get(Drug, drug_id)

    async def get_by_ids(self, drug_ids: list[UUID]) -> list[Drug]:
        """Batch lookup danh sách thuốc theo IDs, giới hạn tối đa MAX_DRUGS_PER_CHECK (20)."""
        if not drug_ids:
            return []
        bounded_ids = drug_ids[:MAX_DRUGS_PER_CHECK]
        stmt = select(Drug).where(Drug.id.in_(bounded_ids))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
