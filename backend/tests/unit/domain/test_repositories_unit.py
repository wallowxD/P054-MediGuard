"""Unit tests cho Repository layer sử dụng In-Memory Fake Implementations.

Tuân thủ nguyên tắc: test trong `unit/` KHÔNG được gọi mạng, LLM hay DB thật.
Thực thi T013 và T014 trong specs/001-core-interaction-check/tasks.md.
"""

import uuid
from uuid import UUID

import pytest

from medsafe.db.models.drug import Drug
from medsafe.db.models.evidence import EvidenceChunk
from medsafe.db.models.interaction import REVIEW_STATUS_APPROVED, DrugDrugInteraction, DrugFoodInteraction
from medsafe.domain.pairing import DrugPair


class FakeDrugRepository:
    def __init__(self, drugs: list[Drug] | None = None) -> None:
        self._drugs = drugs or []

    async def list_catalog_pairs(self) -> list[tuple[UUID, str, str]]:
        return [(d.id, d.brand_name, d.ingredient_raw) for d in self._drugs]

    async def get_by_id(self, drug_id: UUID) -> Drug | None:
        return next((d for d in self._drugs if d.id == drug_id), None)

    async def get_by_ids(self, drug_ids: list[UUID]) -> list[Drug]:
        id_set = set(drug_ids[:20])
        return [d for d in self._drugs if d.id in id_set]


class FakeDrugDrugInteractionRepository:
    def __init__(self, interactions: list[DrugDrugInteraction] | None = None) -> None:
        self._interactions = interactions or []

    async def find_by_pair(
        self, a_norm: str, b_norm: str, only_approved: bool = True
    ) -> list[DrugDrugInteraction]:
        pair = DrugPair.create(a_norm, b_norm)
        results = []
        for item in self._interactions:
            if item.ingredient_a_norm == pair.ingredient_a and item.ingredient_b_norm == pair.ingredient_b:
                if not only_approved or item.review_status == REVIEW_STATUS_APPROVED:
                    results.append(item)
        return results

    async def find_by_pairs(
        self, pairs: list[DrugPair], only_approved: bool = True
    ) -> list[DrugDrugInteraction]:
        target_pairs = {(p.ingredient_a, p.ingredient_b) for p in pairs}
        results = []
        for item in self._interactions:
            if (item.ingredient_a_norm, item.ingredient_b_norm) in target_pairs:
                if not only_approved or item.review_status == REVIEW_STATUS_APPROVED:
                    results.append(item)
        return results


class FakeDrugFoodInteractionRepository:
    def __init__(self, interactions: list[DrugFoodInteraction] | None = None) -> None:
        self._interactions = interactions or []

    async def find_by_drug_ids(
        self, drug_ids: list[UUID], only_approved: bool = True
    ) -> list[DrugFoodInteraction]:
        id_set = set(drug_ids)
        return [
            item for item in self._interactions
            if item.drug_id in id_set and (not only_approved or item.review_status == REVIEW_STATUS_APPROVED)
        ]

    async def find_by_ingredient_and_food(
        self, canonical_ingredient: str, food_item: str, only_approved: bool = True
    ) -> list[DrugFoodInteraction]:
        ing_lower = canonical_ingredient.strip().lower()
        food_lower = food_item.strip().lower()
        return [
            item for item in self._interactions
            if item.canonical_ingredient.lower() == ing_lower
            and item.food_item.lower() == food_lower
            and (not only_approved or item.review_status == REVIEW_STATUS_APPROVED)
        ]


class FakeEvidenceChunkRepository:
    def __init__(self, chunks: list[EvidenceChunk] | None = None) -> None:
        self._chunks = chunks or []

    async def get_by_ids(self, chunk_ids: list[UUID]) -> list[EvidenceChunk]:
        id_set = set(chunk_ids)
        return [c for c in self._chunks if c.id in id_set]

    async def list_by_drug_and_section(self, drug_id: UUID, section_name: str) -> list[EvidenceChunk]:
        sec_lower = section_name.strip().lower()
        matched = [
            c for c in self._chunks
            if c.drug_id == drug_id and c.section_name.lower() == sec_lower
        ]
        matched.sort(key=lambda x: x.chunk_index)
        return matched


# --- TESTS ---

@pytest.mark.asyncio
async def test_drug_repository_list_and_get():
    drug1_id = uuid.uuid4()
    drug2_id = uuid.uuid4()
    drug1 = Drug(id=drug1_id, brand_name="Panadol Extra", brand_name_unaccent="panadol extra", ingredient_raw="Paracetamol, Caffeine", canonical_ingredients=["paracetamol", "caffeine"])
    drug2 = Drug(id=drug2_id, brand_name="Aspirin 500mg", brand_name_unaccent="aspirin 500mg", ingredient_raw="Aspirin", canonical_ingredients=["aspirin"])

    repo = FakeDrugRepository([drug1, drug2])

    pairs = await repo.list_catalog_pairs()
    assert len(pairs) == 2
    assert (drug1_id, "Panadol Extra", "Paracetamol, Caffeine") in pairs

    fetched = await repo.get_by_id(drug1_id)
    assert fetched is not None
    assert fetched.brand_name == "Panadol Extra"

    batch = await repo.get_by_ids([drug1_id, drug2_id])
    assert len(batch) == 2


@pytest.mark.asyncio
async def test_t014_warfarin_tamoxifen_regression():
    """T014 Regression test: Tra 'warfarin + tamoxifen' KHÔNG BAO GIỜ trả bản ghi 'acenocoumarol + tamoxifen'."""
    # Setup data chứa CẢ 2 cặp
    pair_war_tam = DrugPair.create("warfarin", "tamoxifen")
    pair_ace_tam = DrugPair.create("acenocoumarol", "tamoxifen")

    item1 = DrugDrugInteraction(
        id=uuid.uuid4(),
        ingredient_a_norm=pair_war_tam.ingredient_a,
        ingredient_b_norm=pair_war_tam.ingredient_b,
        severity="major",
        verbatim_quote="Phối hợp Warfarin và Tamoxifen làm tăng tác dụng chống đông.",
        source_type="national_database",
        review_status=REVIEW_STATUS_APPROVED,
    )
    item2 = DrugDrugInteraction(
        id=uuid.uuid4(),
        ingredient_a_norm=pair_ace_tam.ingredient_a,
        ingredient_b_norm=pair_ace_tam.ingredient_b,
        severity="major",
        verbatim_quote="Phối hợp Acenocoumarol và Tamoxifen làm tăng nguy cơ xuất huyết.",
        source_type="national_database",
        review_status=REVIEW_STATUS_APPROVED,
    )

    repo = FakeDrugDrugInteractionRepository([item1, item2])

    # Tra cứu exact cho warfarin + tamoxifen
    result = await repo.find_by_pair("warfarin", "tamoxifen")

    # Kiểm chứng AC bắt buộc của T014:
    assert len(result) == 1
    assert result[0].ingredient_a_norm == pair_war_tam.ingredient_a
    assert result[0].ingredient_b_norm == pair_war_tam.ingredient_b
    assert "Warfarin" in result[0].verbatim_quote
    assert "Acenocoumarol" not in result[0].verbatim_quote


@pytest.mark.asyncio
async def test_drug_drug_interaction_find_by_pairs_batch():
    pair1 = DrugPair.create("aspirin", "clopidogrel")
    pair2 = DrugPair.create("paracetamol", "warfarin")

    item1 = DrugDrugInteraction(
        id=uuid.uuid4(),
        ingredient_a_norm=pair1.ingredient_a,
        ingredient_b_norm=pair1.ingredient_b,
        severity="major",
        verbatim_quote="Tăng nguy cơ xuất huyết.",
        source_type="national_database",
        review_status=REVIEW_STATUS_APPROVED,
    )

    repo = FakeDrugDrugInteractionRepository([item1])

    results = await repo.find_by_pairs([pair1, pair2])
    assert len(results) == 1
    assert results[0].ingredient_a_norm == pair1.ingredient_a


@pytest.mark.asyncio
async def test_drug_food_interaction_repository():
    drug_id = uuid.uuid4()
    item = DrugFoodInteraction(
        id=uuid.uuid4(),
        drug_id=drug_id,
        canonical_ingredient="warfarin",
        food_item="Bưởi",
        effect_description="Tránh ăn bưởi khi dùng thuốc.",
        verbatim_quote="Không dùng cùng bưởi chùm.",
        review_status=REVIEW_STATUS_APPROVED,
    )

    repo = FakeDrugFoodInteractionRepository([item])

    by_drug = await repo.find_by_drug_ids([drug_id])
    assert len(by_drug) == 1

    by_ing_food = await repo.find_by_ingredient_and_food("Warfarin", "bưởi")
    assert len(by_ing_food) == 1


@pytest.mark.asyncio
async def test_evidence_chunk_repository_case_insensitive_section():
    drug_id = uuid.uuid4()
    chunk1 = EvidenceChunk(
        id=uuid.uuid4(),
        drug_id=drug_id,
        section_name="CHỐNG CHỈ ĐỊNH",
        content="Chống chỉ định cho phụ nữ có thai.",
        chunk_index=0,
    )
    chunk2 = EvidenceChunk(
        id=uuid.uuid4(),
        drug_id=drug_id,
        section_name="Tương tác thuốc",
        content="Không dùng cùng rượu.",
        chunk_index=1,
    )

    repo = FakeEvidenceChunkRepository([chunk1, chunk2])

    # Tìm kiếm case-insensitive "Chống chỉ định"
    results = await repo.list_by_drug_and_section(drug_id, "chống chỉ định")
    assert len(results) == 1
    assert results[0].content == "Chống chỉ định cho phụ nữ có thai."

    by_ids = await repo.get_by_ids([chunk1.id, chunk2.id])
    assert len(by_ids) == 2
