"""Toàn bộ SQL liên quan tới `drug_drug_interactions` và `drug_food_interactions`.

★ `drug_drug_interactions` là nguồn sự thật cho câu hỏi "cặp thuốc này có tương tác không".
  Truy vấn phải là EXACT LOOKUP theo `(ingredient_a_norm, ingredient_b_norm)` — similarity search
  bị CẤM dùng làm cơ sở kết luận ở đây (ADR 0004, ADR 0012).
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.interaction import (
    REVIEW_STATUS_APPROVED,
    REVIEW_STATUS_REJECTED,
    DrugDrugInteraction,
    DrugFoodInteraction,
)
from medsafe.domain.pairing import DrugPair


class DrugDrugInteractionRepository(Protocol):
    """Cổng truy cập dữ liệu tương tác thuốc – thuốc."""

    async def find_by_pair(self, a_norm: str, b_norm: str, only_approved: bool = True) -> list[DrugDrugInteraction]: ...

    async def find_by_pairs(self, pairs: list[DrugPair], only_approved: bool = True) -> list[DrugDrugInteraction]: ...


class SqlDrugDrugInteractionRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_pair(self, a_norm: str, b_norm: str, only_approved: bool = True) -> list[DrugDrugInteraction]:
        """Tra cứu exact cặp thuốc (a_norm, b_norm) đã sort/lowercase theo DrugPair.create().

        CẤM dùng ilike, fuzzy hay similarity search ở đây (ADR 0004, ADR 0012).
        """
        pair = DrugPair.create(a_norm, b_norm)
        stmt = select(DrugDrugInteraction).where(
            DrugDrugInteraction.ingredient_a_norm == pair.ingredient_a,
            DrugDrugInteraction.ingredient_b_norm == pair.ingredient_b,
        )
        if only_approved:
            stmt = stmt.where(DrugDrugInteraction.review_status == REVIEW_STATUS_APPROVED)
        else:
            stmt = stmt.where(
                func.coalesce(DrugDrugInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED
            )

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_pairs(self, pairs: list[DrugPair], only_approved: bool = True) -> list[DrugDrugInteraction]:
        """Tra cứu một query cho cả basket (tránh N+1 queries).

        Dùng `or_(*pair_conditions)` kết hợp exact matching trên cặp (ingredient_a_norm, ingredient_b_norm).
        """
        if not pairs:
            return []

        # Khử trùng lặp các cặp đầu vào
        unique_pairs = list({(p.ingredient_a, p.ingredient_b) for p in pairs})

        conditions = [
            (DrugDrugInteraction.ingredient_a_norm == ing_a) & (DrugDrugInteraction.ingredient_b_norm == ing_b)
            for ing_a, ing_b in unique_pairs
        ]

        stmt = select(DrugDrugInteraction).where(or_(*conditions))
        if only_approved:
            stmt = stmt.where(DrugDrugInteraction.review_status == REVIEW_STATUS_APPROVED)
        else:
            stmt = stmt.where(
                func.coalesce(DrugDrugInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED
            )

        result = await self._session.execute(stmt)
        return list(result.scalars().all())


class DrugFoodInteractionRepository(Protocol):
    """Cổng truy cập dữ liệu tương tác thuốc – thực phẩm."""

    async def find_by_drug_ids(self, drug_ids: list[UUID], only_approved: bool = True) -> list[DrugFoodInteraction]: ...

    async def find_by_ingredient_and_food(
        self, canonical_ingredient: str, food_item: str, only_approved: bool = True
    ) -> list[DrugFoodInteraction]: ...


class SqlDrugFoodInteractionRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_drug_ids(self, drug_ids: list[UUID], only_approved: bool = True) -> list[DrugFoodInteraction]:
        """Tìm tương tác thực phẩm theo danh sách drug_ids."""
        if not drug_ids:
            return []
        stmt = select(DrugFoodInteraction).where(DrugFoodInteraction.drug_id.in_(drug_ids))
        if only_approved:
            stmt = stmt.where(DrugFoodInteraction.review_status == REVIEW_STATUS_APPROVED)

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def find_by_ingredient_and_food(
        self, canonical_ingredient: str, food_item: str, only_approved: bool = True
    ) -> list[DrugFoodInteraction]:
        """Tìm tương tác theo tên hoạt chất chuẩn và thực phẩm."""
        norm_ing = canonical_ingredient.strip().lower()
        norm_food = food_item.strip().lower()

        stmt = select(DrugFoodInteraction).where(
            DrugFoodInteraction.canonical_ingredient.ilike(norm_ing),
            DrugFoodInteraction.food_item.ilike(norm_food),
        )
        if only_approved:
            stmt = stmt.where(DrugFoodInteraction.review_status == REVIEW_STATUS_APPROVED)

        result = await self._session.execute(stmt)
        return list(result.scalars().all())
