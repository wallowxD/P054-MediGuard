"""Regression cho pairing/citation/severity của màn tra cứu tổng hợp."""

from types import SimpleNamespace
from uuid import uuid4

import pytest

from medsafe.db.models.drug import Drug
from medsafe.db.models.evidence import EvidenceChunk
from medsafe.db.models.interaction import DrugDiseaseInteraction, DrugFoodInteraction, DrugSupplementInteraction
from medsafe.db.repositories.unified_interaction_repository import (
    CategorizedSupplementInteraction,
    MappedDiseaseInteraction,
)
from medsafe.domain.normalization import ingredient_lookup_keys
from medsafe.domain.supplement_category import supplement_note_kind
from medsafe.schemas.interactions import AISummary, Citation, InteractionItem
from medsafe.services.interaction_check_service import SEVERITY_ORDER, InteractionCheckService


def _drug(name: str, ingredients: list[str], leaflet_url: str = "https://example.test/leaflet.pdf") -> Drug:
    return Drug(
        id=uuid4(),
        brand_name=name,
        brand_name_unaccent=name.lower(),
        ingredient_raw=", ".join(ingredients),
        canonical_ingredients=ingredients,
        leaflet_url=leaflet_url,
        version="v2",
    )


def test_cross_drug_pairs_never_substitutes_nearby_ingredient() -> None:
    pairs = InteractionCheckService._cross_drug_pairs(
        [_drug("Warfarin", ["warfarin"]), _drug("Tamoxifen", ["tamoxifen"])]
    )
    assert [(pair.ingredient_a, pair.ingredient_b) for pair in pairs] == [("tamoxifen", "warfarin")]
    assert all("acenocoumarol" not in (pair.ingredient_a, pair.ingredient_b) for pair in pairs)


def test_tenofovir_tdf_uses_only_controlled_exact_lookup_aliases() -> None:
    assert ingredient_lookup_keys("Tenofovir disoproxil fumarate") == (
        "tenofovir",
        "tenofovir disoproxil fumarat",
        "tenofovir disoproxil fumarate",
    )
    assert ingredient_lookup_keys("tamoxifen") == ("tamoxifen",)


def test_citation_requires_quote_and_resolvable_source() -> None:
    drug = _drug("Aspirin", ["acid acetylsalicylic"])
    row = SimpleNamespace(id=uuid4(), version="v2")
    service = object.__new__(InteractionCheckService)
    missing = service._citation(
        kind="drug-drug",
        row=row,
        quote="",
        source_drug_id=drug.id,
        direct_url=None,
        drugs=[drug],
        evidence=[],
        ingredient="acid acetylsalicylic",
    )
    citation = service._citation(
        kind="drug-drug",
        row=row,
        quote="Nguyên văn",
        source_drug_id=drug.id,
        direct_url=None,
        drugs=[drug],
        evidence=[],
        ingredient="acid acetylsalicylic",
    )
    assert missing is None
    assert citation is not None
    assert citation.evidence_id.startswith(f"drug-drug:{row.id}")
    assert citation.chunk_id is None


def test_citation_resolves_exact_chunk_without_source_fk() -> None:
    drive_pdf = "https://drive.google.com/file/d/leaflet-id/view?usp=drive_link"
    drug = _drug("Aspirin", ["acid acetylsalicylic"], leaflet_url=drive_pdf)
    chunk = EvidenceChunk(
        id=uuid4(),
        drug_id=drug.id,
        section_name="TƯƠNG TÁC THUỐC",
        content="Đầu. Nguyên văn. Cuối.",
        chunk_index=1,
        source_url="https://storage.example.test/ocr/aspirin.md",
        version="v2",
    )
    service = object.__new__(InteractionCheckService)
    citation = service._citation(
        kind="drug-food",
        row=SimpleNamespace(id=uuid4(), created_at=None),
        quote="Nguyên văn",
        source_drug_id=None,
        direct_url=None,
        drugs=[drug],
        evidence=[chunk],
        ingredient="acid acetylsalicylic",
    )
    assert citation is not None
    assert citation.chunk_id == chunk.id
    assert citation.source_url == drive_pdf


def test_food_note_rejects_markdown_source_without_drive_pdf() -> None:
    drug = _drug("Aspirin", ["acid acetylsalicylic"], leaflet_url="")
    chunk = EvidenceChunk(
        id=uuid4(),
        drug_id=drug.id,
        section_name="TƯƠNG TÁC THUỐC",
        content="Nguyên văn",
        chunk_index=1,
        source_url="https://storage.example.test/ocr/aspirin.md",
        version="v2",
    )
    service = object.__new__(InteractionCheckService)

    citation = service._citation(
        kind="drug-food",
        row=SimpleNamespace(id=uuid4(), created_at=None),
        quote="Nguyên văn",
        source_drug_id=None,
        direct_url=None,
        drugs=[drug],
        evidence=[chunk],
        ingredient="acid acetylsalicylic",
    )

    assert citation is None


def test_severity_order_is_deterministic() -> None:
    assert SEVERITY_ORDER == ("contraindicated", "major", "moderate", "minor", "unknown")


def test_primary_disease_result_groups_raw_alias_by_canonical_disease_id() -> None:
    drug = _drug("Metformin", ["metformin"])
    disease_id = uuid4()
    disease = SimpleNamespace(id=disease_id, name="Đái tháo đường")
    raw_interaction = DrugDiseaseInteraction(
        id=uuid4(),
        drug_id=drug.id,
        canonical_ingredient="metformin",
        disease_name="tiểu đường",
        disease_name_unaccent="tieu duong",
        severity="moderate",
        effect_description="Cảnh báo theo dữ liệu nguồn.",
        verbatim_quote="Nguyên văn cảnh báo cho người bệnh tiểu đường.",
        source_type="leaflet_ocr",
        source_leaflet_url=drug.leaflet_url,
        review_status="pending_review",
        version="v2",
    )
    service = object.__new__(InteractionCheckService)

    items, unavailable = service._build_primary(
        [drug],
        [drug],
        [disease],
        [],
        [],
        [MappedDiseaseInteraction(interaction=raw_interaction, disease_id=disease_id)],
        [],
    )

    assert unavailable == []
    assert len(items) == 1
    assert items[0].subject == "Metformin"
    assert items[0].object == "Đái tháo đường"
    assert items[0].review_status == "pending"


def test_primary_disease_result_preserves_qualified_source_condition() -> None:
    drug = _drug("Ketoproxin", ["ketoprofen"])
    disease_id = uuid4()
    disease = SimpleNamespace(id=disease_id, name="Suy giảm chức năng thận")
    raw_interaction = DrugDiseaseInteraction(
        id=uuid4(),
        drug_id=drug.id,
        canonical_ingredient="ketoprofen",
        disease_name="Suy thận nặng",
        disease_name_unaccent="suy than nang",
        severity="contraindicated",
        effect_description="",
        management="Chống chỉ định",
        verbatim_quote="Suy thận nặng.",
        source_type="leaflet_ocr",
        source_leaflet_url=drug.leaflet_url,
        review_status="pending_review",
        version="v2",
    )
    service = object.__new__(InteractionCheckService)

    items, unavailable = service._build_primary(
        [drug],
        [drug],
        [disease],
        [],
        [],
        [MappedDiseaseInteraction(interaction=raw_interaction, disease_id=disease_id, requires_context=True)],
        [],
    )

    assert unavailable == []
    assert len(items) == 1
    assert items[0].object == "Suy thận nặng — thuộc nhóm Suy giảm chức năng thận"
    assert items[0].severity == "contraindicated"


def test_primary_disease_result_deduplicates_one_raw_interaction_mapped_to_multiple_selected_diseases() -> None:
    drug = _drug("Sodium chloride", ["sodium chloride"])
    renal_id = uuid4()
    liver_id = uuid4()
    diseases = [
        SimpleNamespace(id=renal_id, name="Suy giảm chức năng thận"),
        SimpleNamespace(id=liver_id, name="Xơ gan"),
    ]
    raw_interaction = DrugDiseaseInteraction(
        id=uuid4(),
        drug_id=drug.id,
        canonical_ingredient="sodium chloride",
        disease_name="Suy thận nặng, xơ gan",
        disease_name_unaccent="suy than nang, xo gan",
        severity="moderate",
        effect_description="Cần thận trọng khi sử dụng.",
        management="Thận trọng khi sử dụng",
        verbatim_quote="Người bệnh suy thận nặng, xơ gan.",
        source_type="leaflet_ocr",
        source_leaflet_url=drug.leaflet_url,
        review_status="pending_review",
        version="v2",
    )
    mapped_rows = [
        MappedDiseaseInteraction(interaction=raw_interaction, disease_id=renal_id, requires_context=True),
        MappedDiseaseInteraction(interaction=raw_interaction, disease_id=liver_id, requires_context=True),
    ]
    service = object.__new__(InteractionCheckService)

    items, unavailable = service._build_primary([drug], [drug], diseases, [], [], mapped_rows, [])

    assert unavailable == []
    assert len(items) == 1
    assert items[0].object == "Suy thận nặng, xơ gan — thuộc nhóm Suy giảm chức năng thận"


@pytest.mark.parametrize("category", ["food", "beverage", "fruit", " FOOD "])
def test_supplement_catalog_food_categories_are_grouped_as_food(category: str) -> None:
    assert supplement_note_kind(category) == "drug-food"


@pytest.mark.parametrize("category", ["supplement", "herb", " SUPPLEMENT "])
def test_supplement_catalog_supplement_categories_are_grouped_as_supplement(category: str) -> None:
    assert supplement_note_kind(category) == "drug-supplement"


@pytest.mark.parametrize("category", [None, "", "unknown"])
def test_supplement_catalog_unknown_category_is_not_guessed(category: str | None) -> None:
    assert supplement_note_kind(category) is None


def test_food_note_merges_legacy_and_categorized_supplement_rows_without_duplicate() -> None:
    drive_pdf = "https://drive.google.com/file/d/felodipine-leaflet/view?usp=sharing"
    drug = _drug("Felodipine STELLA 5 mg retard", ["felodipine"], leaflet_url=drive_pdf)
    legacy_row = DrugFoodInteraction(
        id=uuid4(),
        drug_id=drug.id,
        canonical_ingredient="felodipine",
        food_item="Nước ép bưởi",
        effect_description="Không uống thuốc với nước ép bưởi.",
        management=None,
        verbatim_quote="Không uống thuốc với nước ép bưởi.",
        review_status="approved",
    )
    categorized_row = DrugSupplementInteraction(
        id=uuid4(),
        drug_id=drug.id,
        canonical_ingredient="felodipine",
        supplement_id=None,
        supplement_name="Nước ép bưởi",
        supplement_name_unaccent="nuoc ep buoi",
        severity="moderate",
        effect_description="",
        management="Không uống thuốc với nước ép bưởi.",
        verbatim_quote="- Không uống thuốc với nước ép bưởi.",
        source_type="leaflet_ocr",
        version="v2",
        review_status="pending_review",
    )
    service = object.__new__(InteractionCheckService)

    notes = service._build_notes(
        [drug],
        [legacy_row],
        [CategorizedSupplementInteraction(interaction=categorized_row, category="beverage")],
        [],
    )

    assert len(notes) == 1
    assert notes[0].id == f"drug-food:{categorized_row.id}"
    assert notes[0].kind == "drug-food"
    assert notes[0].object == "Nước ép bưởi"
    assert notes[0].effect_description == "Không uống thuốc với nước ép bưởi."
    assert notes[0].management is None
    assert notes[0].severity == "moderate"
    assert notes[0].review_status == "pending"
    assert len(notes[0].citations) == 1
    assert notes[0].citations[0].source_url == drive_pdf


def test_food_note_keeps_legacy_row_when_no_categorized_row_exists() -> None:
    drive_pdf = "https://drive.google.com/file/d/legacy-food-leaflet/view"
    drug = _drug("Legacy drug", ["legacy ingredient"], leaflet_url=drive_pdf)
    legacy_row = DrugFoodInteraction(
        id=uuid4(),
        drug_id=drug.id,
        canonical_ingredient="legacy ingredient",
        food_item="Thức ăn",
        effect_description="Uống cùng thức ăn.",
        management=None,
        verbatim_quote="Uống cùng thức ăn.",
        review_status="pending_review",
    )
    service = object.__new__(InteractionCheckService)

    notes = service._build_notes([drug], [legacy_row], [], [])

    assert len(notes) == 1
    assert notes[0].id == f"drug-food:{legacy_row.id}"
    assert notes[0].object == "Thức ăn"
    assert notes[0].effect_description == "Uống cùng thức ăn."


def _interaction() -> InteractionItem:
    return InteractionItem(
        id="drug-drug:1",
        kind="drug-drug",
        severity="moderate",
        review_status="pending",
        subject="aspirin",
        object="naproxen",
        consequence="Tăng nguy cơ chảy máu.",
        management="Theo dõi theo hướng dẫn sử dụng.",
        ai_summary=AISummary(
            status="fallback",
            warning="Tăng nguy cơ chảy máu.",
            management_bullets=["Theo dõi theo hướng dẫn sử dụng."],
        ),
        citations=[
            Citation(
                evidence_id="drug-drug:1:v2",
                quote="Nguyên văn",
                source="Aspirin",
                source_url="https://example.test/source.pdf",
            )
        ],
    )


@pytest.mark.asyncio
async def test_summary_timeout_preserves_raw_fallback() -> None:
    class TimeoutLLM:
        async def generate_structured(self, *args: object, **kwargs: object) -> object:
            raise TimeoutError

    service = object.__new__(InteractionCheckService)
    service.llm = TimeoutLLM()
    service.llm_config = SimpleNamespace(concurrency=3, batch_size=40, timeout_seconds=5)
    result = await service._summarize([_interaction()])

    assert result[0]["consequence"] == "Tăng nguy cơ chảy máu."
    assert result[0]["aiSummary"]["status"] == "fallback"


@pytest.mark.asyncio
async def test_summary_with_missing_id_falls_back_for_whole_batch() -> None:
    class WrongIdLLM:
        async def generate_structured(self, *args: object, **kwargs: object) -> object:
            return SimpleNamespace(
                summaries=[SimpleNamespace(record_id="drug-drug:invented", warning="Sai", management_bullets=[])]
            )

    service = object.__new__(InteractionCheckService)
    service.llm = WrongIdLLM()
    service.llm_config = SimpleNamespace(concurrency=3, batch_size=40, timeout_seconds=5)
    result = await service._summarize([_interaction()])

    assert result[0]["aiSummary"]["status"] == "fallback"
    assert result[0]["aiSummary"]["warning"] == "Tăng nguy cơ chảy máu."
