"""Batch SQL cho màn tra cứu tương tác tổng hợp."""

from collections.abc import Sequence
from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.drug import Drug
from medsafe.db.models.evidence import EvidenceChunk
from medsafe.db.models.interaction import (
    REVIEW_STATUS_REJECTED,
    DrugDiseaseInteraction,
    DrugDrugInteraction,
    DrugFoodInteraction,
    DrugSupplementInteraction,
    Supplement,
)
from medsafe.domain.normalization import normalize_disease_name, normalize_for_matching


@dataclass(frozen=True, slots=True)
class CategorizedSupplementInteraction:
    """Interaction kèm category đã resolve từ danh mục `supplements`."""

    interaction: DrugSupplementInteraction
    category: str | None


class SqlUnifiedInteractionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_disease_interactions(
        self, ingredient_disease_pairs: Sequence[tuple[str, str]]
    ) -> list[DrugDiseaseInteraction]:
        conditions = [
            and_(
                DrugDiseaseInteraction.canonical_ingredient == normalize_for_matching(ingredient),
                DrugDiseaseInteraction.disease_name_unaccent == normalize_disease_name(disease),
            )
            for ingredient, disease in set(ingredient_disease_pairs)
        ]
        if not conditions:
            return []
        result = await self._session.execute(
            select(DrugDiseaseInteraction).where(
                or_(*conditions),
                func.coalesce(DrugDiseaseInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED,
            )
        )
        return list(result.scalars().all())

    async def find_food_notes(self, ingredients: Sequence[str], drug_ids: Sequence[UUID]) -> list[DrugFoodInteraction]:
        normalized = {normalize_for_matching(value) for value in ingredients}
        result = await self._session.execute(
            select(DrugFoodInteraction).where(
                or_(
                    DrugFoodInteraction.canonical_ingredient.in_(normalized), DrugFoodInteraction.drug_id.in_(drug_ids)
                ),
                func.coalesce(DrugFoodInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED,
            )
        )
        return list(result.scalars().all())

    async def find_supplement_notes(
        self, ingredients: Sequence[str], drug_ids: Sequence[UUID]
    ) -> list[CategorizedSupplementInteraction]:
        normalized = {normalize_for_matching(value) for value in ingredients}

        # Dữ liệu hiện hành chưa điền supplement_id. Fallback theo exact normalized key,
        # chỉ nhận category khi mọi catalog row trùng key đều cùng một category.
        category_by_name = (
            select(
                Supplement.supplement_name_unaccent.label("supplement_name_unaccent"),
                case(
                    (func.count(func.distinct(Supplement.category)) == 1, func.min(Supplement.category)),
                    else_=None,
                ).label("category"),
            )
            .group_by(Supplement.supplement_name_unaccent)
            .subquery()
        )
        resolved_category = func.coalesce(Supplement.category, category_by_name.c.category)
        result = await self._session.execute(
            select(DrugSupplementInteraction, resolved_category)
            .outerjoin(Supplement, Supplement.id == DrugSupplementInteraction.supplement_id)
            .outerjoin(
                category_by_name,
                category_by_name.c.supplement_name_unaccent
                == DrugSupplementInteraction.supplement_name_unaccent,
            )
            .where(
                or_(
                    DrugSupplementInteraction.canonical_ingredient.in_(normalized),
                    DrugSupplementInteraction.drug_id.in_(drug_ids),
                ),
                func.coalesce(DrugSupplementInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED,
            )
        )
        return [CategorizedSupplementInteraction(interaction=row, category=category) for row, category in result.all()]

    async def list_candidate_evidence(self, drug_ids: Sequence[UUID]) -> list[EvidenceChunk]:
        if not drug_ids:
            return []
        result = await self._session.execute(
            select(EvidenceChunk)
            .where(EvidenceChunk.drug_id.in_(drug_ids))
            .order_by(EvidenceChunk.drug_id, EvidenceChunk.chunk_index)
        )
        return list(result.scalars().all())

    async def get_source_drugs(self, drug_ids: Sequence[UUID]) -> list[Drug]:
        if not drug_ids:
            return []
        result = await self._session.execute(select(Drug).where(Drug.id.in_(set(drug_ids))))
        return list(result.scalars().all())

    async def distinct_severities(self) -> set[str]:
        statements = (
            select(DrugDrugInteraction.severity).where(
                func.coalesce(DrugDrugInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED
            ),
            select(DrugDiseaseInteraction.severity).where(
                func.coalesce(DrugDiseaseInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED
            ),
            select(DrugSupplementInteraction.severity).where(
                func.coalesce(DrugSupplementInteraction.review_status, "pending_review") != REVIEW_STATUS_REJECTED
            ),
        )
        values: set[str] = set()
        for statement in statements:
            values.update(str(value) for value in (await self._session.execute(statement)).scalars().all() if value)
        return values
