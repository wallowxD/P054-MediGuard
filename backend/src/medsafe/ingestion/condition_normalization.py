"""Batch dry-run chuẩn hóa toàn bộ condition mention và xuất CSV để duyệt."""

import argparse
import asyncio
import csv
import json
import sys
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Protocol

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.config import REPO_ROOT, get_condition_normalization_config
from medsafe.db.repositories.condition_normalization_repository import SqlConditionNormalizationRepository
from medsafe.db.session import dispose_engine, get_sessionmaker
from medsafe.domain.condition_normalization import (
    CONDITION_CONCEPTS,
    Component,
    ConditionConceptCode,
    MentionInput,
    MentionMapping,
    Qualifiers,
    fallback_mapping,
    rule_mapping,
)
from medsafe.llm.llm_client import LLMClient
from medsafe.prompts.prompt_templates import CONDITION_NORMALIZATION_PROMPT, CONDITION_NORMALIZATION_SYSTEM


class QualifierProposal(BaseModel):
    severity: Literal["mild", "moderate", "severe", "unknown"] | None = None
    course: Literal["acute", "chronic", "unknown"] | None = None
    stage: Literal["end_stage", "unknown"] | None = None
    dialysis: bool | None = None
    criteria_text: list[str] = Field(default_factory=list)


class ComponentProposal(BaseModel):
    concept_code: ConditionConceptCode
    qualifiers: QualifierProposal = Field(default_factory=QualifierProposal)
    source_fragment: str


class MentionProposal(BaseModel):
    record_id: str
    components: list[ComponentProposal]
    expression: Literal["single", "and", "or", "mixed", "unclear"]
    is_compound: bool
    confidence: Literal["high", "medium", "low"]
    reason: str


class NormalizationBatch(BaseModel):
    proposals: list[MentionProposal]


class StructuredGenerator(Protocol):
    async def generate_structured(
        self,
        prompt: str,
        response_schema: type[BaseModel],
        *,
        system: str,
        timeout_seconds: float,
    ) -> Any: ...


CSV_FIELDS = (
    "record_id",
    "raw_mention",
    "normalized_mention",
    "interaction_count",
    "proposed_concept_code",
    "proposed_name_vi",
    "concept_type",
    "body_system",
    "severity",
    "course",
    "stage",
    "dialysis",
    "criteria_text",
    "source_fragment",
    "expression",
    "is_compound",
    "confidence",
    "ai_status",
    "match_status",
    "mapping_status",
    "reason",
    "review_decision",
    "review_note",
)


@dataclass(frozen=True, slots=True)
class RunStats:
    mention_count: int
    row_count: int
    generated_count: int
    mapped_count: int
    unmapped_count: int


def _is_verbatim_fragment(fragment: str, raw_mention: str) -> bool:
    return bool(fragment.strip()) and fragment.strip().casefold() in raw_mention.casefold()


def validate_batch(batch: NormalizationBatch, mentions: Sequence[MentionInput]) -> dict[str, MentionMapping] | None:
    """Chỉ nhận batch đủ ID và mọi fragment còn truy được về raw mention."""
    expected = {mention.record_id: mention for mention in mentions}
    returned_ids = [proposal.record_id for proposal in batch.proposals]
    if len(returned_ids) != len(set(returned_ids)) or set(returned_ids) != set(expected):
        return None

    mappings: dict[str, MentionMapping] = {}
    for proposal in batch.proposals:
        mention = expected[proposal.record_id]
        components: list[Component] = []
        for item in proposal.components:
            if item.concept_code not in CONDITION_CONCEPTS:
                return None
            if not _is_verbatim_fragment(item.source_fragment, mention.raw_mention):
                return None
            if any(not _is_verbatim_fragment(value, mention.raw_mention) for value in item.qualifiers.criteria_text):
                return None
            components.append(
                Component(
                    concept_code=item.concept_code,
                    qualifiers=Qualifiers(
                        severity=item.qualifiers.severity,
                        course=item.qualifiers.course,
                        stage=item.qualifiers.stage,
                        dialysis=item.qualifiers.dialysis,
                        criteria_text=tuple(item.qualifiers.criteria_text),
                    ),
                    source_fragment=item.source_fragment.strip(),
                )
            )
        mappings[proposal.record_id] = MentionMapping(
            record_id=proposal.record_id,
            components=tuple(components),
            expression=proposal.expression,
            is_compound=proposal.is_compound,
            confidence=proposal.confidence,
            reason=proposal.reason.strip(),
            ai_status="generated",
        )
    return mappings


def _concept_catalog_payload() -> dict[str, dict[str, str]]:
    return {
        code: {
            "preferred_name_vi": value.preferred_name_vi,
            "concept_type": value.concept_type,
            "body_system": value.body_system,
        }
        for code, value in CONDITION_CONCEPTS.items()
    }


async def normalize_mentions(
    mentions: Sequence[MentionInput],
    llm: StructuredGenerator,
    *,
    batch_size: int,
    timeout_seconds: float,
) -> list[MentionMapping]:
    """Gọi model theo batch; batch không hợp lệ fallback toàn bộ để không trộn output đáng ngờ."""
    mappings: list[MentionMapping] = []
    concept_catalog_json = json.dumps(_concept_catalog_payload(), ensure_ascii=False, sort_keys=True)
    for start in range(0, len(mentions), batch_size):
        batch_mentions = list(mentions[start : start + batch_size])
        records = [
            {
                "record_id": mention.record_id,
                "raw_mention": mention.raw_mention,
                "interaction_count": mention.interaction_count,
            }
            for mention in batch_mentions
        ]
        try:
            response = await llm.generate_structured(
                CONDITION_NORMALIZATION_PROMPT.format(
                    concept_catalog_json=concept_catalog_json,
                    records_json=json.dumps(records, ensure_ascii=False),
                ),
                NormalizationBatch,
                system=CONDITION_NORMALIZATION_SYSTEM,
                timeout_seconds=timeout_seconds,
            )
            validated = validate_batch(response, batch_mentions)
        except Exception:
            validated = None
        mappings.extend(
            validated[mention.record_id] if validated is not None else fallback_mapping(mention)
            for mention in batch_mentions
        )
    return mappings


def build_review_rows(
    mentions: Sequence[MentionInput], mappings: Sequence[MentionMapping]
) -> list[dict[str, str | int]]:
    """Flatten mapping thành CSV; component trống vẫn giữ một dòng mention để reviewer thấy."""
    mention_map = {mention.record_id: mention for mention in mentions}
    rows: list[dict[str, str | int]] = []
    for mapping in mappings:
        mention = mention_map[mapping.record_id]
        components: Sequence[Component | None] = mapping.components or (None,)
        for component in components:
            definition = CONDITION_CONCEPTS[component.concept_code] if component else None
            qualifiers = component.qualifiers if component else Qualifiers()
            rows.append(
                {
                    "record_id": mention.record_id,
                    "raw_mention": mention.raw_mention,
                    "normalized_mention": mention.normalized_mention,
                    "interaction_count": mention.interaction_count,
                    "proposed_concept_code": component.concept_code if component else "",
                    "proposed_name_vi": definition.preferred_name_vi if definition else "",
                    "concept_type": definition.concept_type if definition else "",
                    "body_system": definition.body_system if definition else "",
                    "severity": qualifiers.severity or "",
                    "course": qualifiers.course or "",
                    "stage": qualifiers.stage or "",
                    "dialysis": "true"
                    if qualifiers.dialysis is True
                    else "false"
                    if qualifiers.dialysis is False
                    else "",
                    "criteria_text": " | ".join(qualifiers.criteria_text),
                    "source_fragment": component.source_fragment if component else "",
                    "expression": mapping.expression,
                    "is_compound": "true" if mapping.is_compound else "false",
                    "confidence": mapping.confidence,
                    "ai_status": mapping.ai_status,
                    "match_status": "matched" if component else "unmapped",
                    "mapping_status": "needs_review",
                    "reason": mapping.reason,
                    "review_decision": "",
                    "review_note": "",
                }
            )
    return rows


def write_review_csv(path: Path, rows: Sequence[dict[str, str | int]]) -> None:
    """Ghi UTF-8 BOM để Excel trên Windows hiển thị đúng tiếng Việt."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as file_handle:
        writer = csv.DictWriter(file_handle, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


async def run_dry_run(
    session: AsyncSession,
    *,
    output_path: Path,
    limit: int,
    batch_size: int,
    timeout_seconds: float,
    llm: StructuredGenerator,
    use_ai: bool = True,
) -> RunStats:
    """Đọc DB, chuẩn hóa và ghi artifact; session không commit và repository không có mutation."""
    repository = SqlConditionNormalizationRepository(session)
    mentions = await repository.list_mentions(limit=limit)
    mappings = (
        await normalize_mentions(mentions, llm, batch_size=batch_size, timeout_seconds=timeout_seconds)
        if use_ai
        else [rule_mapping(mention) for mention in mentions]
    )
    rows = build_review_rows(mentions, mappings)
    write_review_csv(output_path, rows)
    generated = sum(mapping.ai_status == "generated" for mapping in mappings)
    mapped = sum(bool(mapping.components) for mapping in mappings)
    return RunStats(
        mention_count=len(mentions),
        row_count=len(rows),
        generated_count=generated,
        mapped_count=mapped,
        unmapped_count=len(mentions) - mapped,
    )


def _parser() -> argparse.ArgumentParser:
    config = get_condition_normalization_config()
    parser = argparse.ArgumentParser(description="Dry-run chuẩn hóa toàn bộ condition mention; không ghi database.")
    parser.add_argument("--limit", type=int, default=config.limit)
    parser.add_argument("--batch-size", type=int, default=config.batch_size)
    parser.add_argument("--timeout", type=float, default=config.timeout_seconds)
    parser.add_argument(
        "--no-ai",
        action="store_true",
        help="Chỉ dùng deterministic fallback; không gửi mention tới Gemini.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=REPO_ROOT / "dataset" / "condition_normalization_candidates.csv",
    )
    return parser


async def _async_main(args: argparse.Namespace) -> None:
    config = get_condition_normalization_config()
    if args.limit < 1 or args.limit > 10000:
        raise ValueError("--limit phải nằm trong khoảng 1..10000")
    if args.batch_size < 1 or args.batch_size > 50:
        raise ValueError("--batch-size phải nằm trong khoảng 1..50")
    async with get_sessionmaker()() as session:
        stats = await run_dry_run(
            session,
            output_path=args.output.resolve(),
            limit=args.limit,
            batch_size=args.batch_size,
            timeout_seconds=args.timeout,
            llm=LLMClient(model=config.model),
            use_ai=not args.no_ai,
        )
    await dispose_engine()
    print(f"Đã xuất {stats.row_count} dòng từ {stats.mention_count} mention: {args.output.resolve()}")
    print(f"Rule đã map: {stats.mapped_count}; chưa map: {stats.unmapped_count}")
    if args.no_ai:
        print("Gemini: không sử dụng (--no-ai); mọi đề xuất đều cần duyệt")
    else:
        print(
            f"Gemini hợp lệ: {stats.generated_count}; "
            f"batch fallback sang rule: {stats.mention_count - stats.generated_count}"
        )


def main() -> None:
    """Entry point cho `python -m medsafe.ingestion.condition_normalization`."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(_async_main(_parser().parse_args()))


if __name__ == "__main__":
    main()
