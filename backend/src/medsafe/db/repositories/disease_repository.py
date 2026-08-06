"""Toàn bộ SQL liên quan tới `drug_disease_interactions`.

Protocol `DrugDiseaseRepository` giúp tầng domain/API không phụ thuộc SQLAlchemy trực tiếp;
integration test có thể override bằng implementation in-memory.
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.interaction import REVIEW_STATUS_APPROVED, DrugDiseaseInteraction
from medsafe.domain.normalization import normalize_for_matching, remove_vietnamese_accents


class DrugDiseaseRepository(Protocol):
    """Cổng truy cập dữ liệu tương tác thuốc – bệnh nền."""

    async def get_by_id(self, interaction_id: UUID) -> DrugDiseaseInteraction | None: ...

    async def find_interactions(
        self, canonical_ingredient: str, disease_name: str, only_approved: bool = True
    ) -> list[DrugDiseaseInteraction]: ...

    async def create(
        self,
        *,
        canonical_ingredient: str,
        disease_name: str,
        severity: str,
        verbatim_quote: str,
        source_type: str,
        drug_id: UUID | None = None,
        effect_description: str | None = None,
        management: str | None = None,
        source_leaflet_url: str | None = None,
        review_status: str = "pending_review",
    ) -> DrugDiseaseInteraction: ...


class SqlDrugDiseaseRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, interaction_id: UUID) -> DrugDiseaseInteraction | None:
        return await self._session.get(DrugDiseaseInteraction, interaction_id)

    async def find_interactions(
        self, canonical_ingredient: str, disease_name: str, only_approved: bool = True
    ) -> list[DrugDiseaseInteraction]:
        """Tìm các tương tác giữa một hoạt chất và một tên bệnh nền.

        Canonical ingredient và disease_name được chuẩn hóa chữ thường / bỏ dấu để khớp mờ.
        """
        norm_ingredient = normalize_for_matching(canonical_ingredient)
        disease_unaccent = remove_vietnamese_accents(disease_name).lower().strip()

        stmt = select(DrugDiseaseInteraction).where(
            DrugDiseaseInteraction.canonical_ingredient == norm_ingredient,
            DrugDiseaseInteraction.disease_name_unaccent.contains(disease_unaccent),
        )

        if only_approved:
            stmt = stmt.where(DrugDiseaseInteraction.review_status == REVIEW_STATUS_APPROVED)

        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self,
        *,
        canonical_ingredient: str,
        disease_name: str,
        severity: str,
        verbatim_quote: str,
        source_type: str,
        drug_id: UUID | None = None,
        effect_description: str | None = None,
        management: str | None = None,
        source_leaflet_url: str | None = None,
        review_status: str = "pending_review",
    ) -> DrugDiseaseInteraction:
        norm_ingredient = normalize_for_matching(canonical_ingredient)
        disease_unaccent = remove_vietnamese_accents(disease_name).lower().strip()

        interaction = DrugDiseaseInteraction(
            drug_id=drug_id,
            canonical_ingredient=norm_ingredient,
            disease_name=disease_name.strip(),
            disease_name_unaccent=disease_unaccent,
            severity=severity,
            effect_description=effect_description,
            management=management,
            verbatim_quote=verbatim_quote,
            source_type=source_type,
            source_leaflet_url=source_leaflet_url,
            review_status=review_status,
        )
        self._session.add(interaction)
        await self._session.commit()
        await self._session.refresh(interaction)
        return interaction
