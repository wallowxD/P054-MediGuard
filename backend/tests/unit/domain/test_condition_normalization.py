"""Unit test offline cho batch chuẩn hóa toàn bộ condition mention."""

from pathlib import Path
from typing import cast

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.domain.condition_normalization import (
    CONDITION_CONCEPTS,
    CONDITION_RULES,
    MentionInput,
    fallback_mapping,
    is_renal_hepatic_mention,
    match_condition_concepts,
    mention_record_id,
    rule_mapping,
)
from medsafe.ingestion.condition_normalization import (
    ComponentProposal,
    MentionProposal,
    NormalizationBatch,
    QualifierProposal,
    build_review_rows,
    normalize_mentions,
    run_dry_run,
    validate_batch,
    write_review_csv,
)


def _mention(raw: str, normalized: str | None = None, count: int = 1) -> MentionInput:
    normalized_value = normalized or raw.lower()
    return MentionInput(
        record_id=mention_record_id(normalized_value),
        raw_mention=raw,
        normalized_mention=normalized_value,
        interaction_count=count,
    )


@pytest.mark.parametrize(
    "value",
    ["Suy thận", "Impaired renal function", "Suy gan nặng", "Xơ gan", "GFR < 30 mL/phút"],
)
def test_scope_selects_renal_and_hepatic_mentions(value: str) -> None:
    assert is_renal_hepatic_mention(value)


def test_fallback_keeps_severity_as_qualifier() -> None:
    mapping = fallback_mapping(_mention("Suy thận nặng", "suy than nang"))

    assert mapping.components[0].concept_code == "renal_impairment"
    assert mapping.components[0].qualifiers.severity == "severe"
    assert mapping.ai_status == "fallback"


def test_fallback_does_not_confuse_chuc_nang_with_nang_severity() -> None:
    mapping = fallback_mapping(_mention("Suy giảm chức năng thận", "suy giam chuc nang than"))

    assert mapping.components[0].qualifiers.severity is None


def test_scope_does_not_confuse_than_with_than_kinh_after_removing_accents() -> None:
    assert not is_renal_hepatic_mention("Bệnh thần kinh trung ương và ngoại biên")


def test_general_liver_disease_is_not_forced_to_hepatic_impairment() -> None:
    mapping = fallback_mapping(_mention("Bệnh gan", "benh gan"))

    assert [component.concept_code for component in mapping.components] == ["liver_disease"]


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("cao huyết áp không kiểm soát", {"hypertension"}),
        ("Đái tháo đường tuýp 1", {"type_1_diabetes"}),
        ("hen suyễn", {"asthma"}),
        ("Loét dạ dày - tá tràng", {"peptic_ulcer"}),
        ("Động kinh", {"epilepsy"}),
        ("Glôcôm góc hẹp", {"angle_closure_glaucoma"}),
        ("Không dung nạp fructose bẩm sinh", {"hereditary_fructose_intolerance"}),
        ("Thiếu hụt G6PD", {"g6pd_deficiency"}),
        ("Bệnh vẩy nến", {"psoriasis"}),
        ("Nhiễm HIV", {"hiv_infection"}),
    ],
)
def test_rules_cover_major_body_systems(raw: str, expected: set[str]) -> None:
    assert set(match_condition_concepts(raw)) == expected


def test_taxonomy_codes_are_unique_and_have_definitions() -> None:
    codes = [rule.code for rule in CONDITION_RULES]

    assert len(codes) == len(set(codes))
    assert set(codes) == set(CONDITION_CONCEPTS)


@pytest.mark.parametrize(
    "alias",
    ["đái tháo đường", "tiểu đường", "Bệnh nhân bị tiểu đường"],
)
def test_aliases_merge_to_same_diabetes_concept(alias: str) -> None:
    assert match_condition_concepts(alias) == ("diabetes_mellitus",)


def test_specific_concept_suppresses_generic_concept() -> None:
    assert match_condition_concepts("Bệnh tim do thiếu máu cục bộ") == ("ischemic_heart_disease",)
    assert match_condition_concepts("Bệnh thận mạn tính") == ("chronic_kidney_disease",)
    assert match_condition_concepts("tăng nhãn áp góc đóng") == ("angle_closure_glaucoma",)


def test_rule_mapping_keeps_unmapped_mention_for_review() -> None:
    mapping = rule_mapping(_mention("Một tình trạng chưa có trong taxonomy"))

    assert mapping.components == ()
    assert mapping.confidence == "low"
    assert mapping.ai_status == "not_requested"


def test_fallback_does_not_attach_ambiguous_qualifier_to_both_compound_components() -> None:
    mapping = fallback_mapping(_mention("Suy gan hoặc suy thận nặng", "suy gan hoac suy than nang"))

    assert {component.concept_code for component in mapping.components} == {
        "hepatic_impairment",
        "renal_impairment",
    }
    assert all(component.qualifiers.severity is None for component in mapping.components)
    assert mapping.is_compound
    assert mapping.expression == "or"


def test_validate_batch_requires_complete_ids_and_verbatim_fragments() -> None:
    renal = _mention("Bệnh nhân suy thận nặng", "benh nhan suy than nang")
    valid = NormalizationBatch(
        proposals=[
            MentionProposal(
                record_id=renal.record_id,
                components=[
                    ComponentProposal(
                        concept_code="renal_impairment",
                        qualifiers=QualifierProposal(severity="severe"),
                        source_fragment="suy thận nặng",
                    )
                ],
                expression="single",
                is_compound=False,
                confidence="high",
                reason="Tên đồng nghĩa và mức độ được ghi trực tiếp.",
            )
        ]
    )

    mappings = validate_batch(valid, [renal])

    assert mappings is not None
    assert mappings[renal.record_id].components[0].qualifiers.severity == "severe"
    assert validate_batch(NormalizationBatch(proposals=[]), [renal]) is None


def test_validate_batch_rejects_code_outside_controlled_catalog() -> None:
    mention = _mention("Một tình trạng lạ")
    batch = NormalizationBatch(
        proposals=[
            MentionProposal(
                record_id=mention.record_id,
                components=[
                    ComponentProposal(
                        concept_code="invented_condition",
                        source_fragment=mention.raw_mention,
                    )
                ],
                expression="single",
                is_compound=False,
                confidence="low",
                reason="Không hợp lệ",
            )
        ]
    )

    assert validate_batch(batch, [mention]) is None


@pytest.mark.asyncio
async def test_model_error_falls_back_without_losing_mentions() -> None:
    class BrokenLLM:
        async def generate_structured(self, *args: object, **kwargs: object) -> object:
            raise TimeoutError

    mentions = [
        _mention("Suy thận", "suy than", 95),
        _mention("Suy gan", "suy gan", 51),
    ]
    mappings = await normalize_mentions(mentions, BrokenLLM(), batch_size=20, timeout_seconds=5)

    assert [mapping.record_id for mapping in mappings] == [mention.record_id for mention in mentions]
    assert all(mapping.ai_status == "fallback" for mapping in mappings)


def test_review_csv_has_bom_and_empty_review_columns(tmp_path: Path) -> None:
    mention = _mention("Suy thận", "suy than", 95)
    rows = build_review_rows([mention], [fallback_mapping(mention)])
    output = tmp_path / "review.csv"

    write_review_csv(output, rows)

    raw = output.read_bytes()
    text = raw.decode("utf-8-sig")
    assert raw.startswith(b"\xef\xbb\xbf")
    assert "review_decision,review_note" in text.splitlines()[0]
    assert "body_system" in text.splitlines()[0]
    assert "match_status" in text.splitlines()[0]
    assert "Suy giảm chức năng thận" in text


@pytest.mark.asyncio
async def test_no_ai_dry_run_never_calls_model(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    mention = _mention("Suy thận", "suy than", 95)

    class FakeRepository:
        def __init__(self, session: object) -> None:
            del session

        async def list_mentions(self, *, limit: int) -> list[MentionInput]:
            assert limit == 1
            return [mention]

    class ForbiddenLLM:
        async def generate_structured(self, *args: object, **kwargs: object) -> object:
            raise AssertionError("Gemini không được gọi trong chế độ --no-ai")

    monkeypatch.setattr(
        "medsafe.ingestion.condition_normalization.SqlConditionNormalizationRepository",
        FakeRepository,
    )
    output = tmp_path / "baseline.csv"
    counts = await run_dry_run(
        cast(AsyncSession, object()),
        output_path=output,
        limit=1,
        batch_size=20,
        timeout_seconds=5,
        llm=ForbiddenLLM(),
        use_ai=False,
    )

    assert counts.mention_count == 1
    assert counts.row_count == 1
    assert counts.generated_count == 0
    assert counts.mapped_count == 1
    assert counts.unmapped_count == 0
    assert output.exists()
