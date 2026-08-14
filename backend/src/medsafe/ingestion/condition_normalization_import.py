"""Import artifact chuẩn hóa đã kiểm tra vào canonical disease catalog v2."""

import argparse
import asyncio
import csv
import sys
import uuid
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.config import REPO_ROOT
from medsafe.db.models.disease import (
    DISEASE_ALIAS_REVIEW_PENDING,
    DISEASE_VERSION_V2,
    Disease,
    DiseaseAlias,
)
from medsafe.db.session import dispose_engine, get_sessionmaker
from medsafe.domain.condition_normalization import CONDITION_CONCEPTS
from medsafe.domain.normalization import normalize_disease_name

IMPORT_NAMESPACE = uuid.UUID("28d65429-2e3f-4f85-b386-13fb40f91be7")
REQUIRED_COLUMNS = frozenset(
    {
        "record_id",
        "raw_mention",
        "normalized_mention",
        "proposed_concept_code",
        "proposed_name_vi",
        "concept_type",
        "body_system",
        "severity",
        "course",
        "stage",
        "dialysis",
        "criteria_text",
        "expression",
        "is_compound",
        "match_status",
        "mapping_status",
        "review_decision",
    }
)


@dataclass(frozen=True, slots=True)
class CanonicalDiseaseSeed:
    concept_code: str
    name: str
    name_unaccent: str
    body_system: str
    concept_type: str


@dataclass(frozen=True, slots=True)
class DiseaseAliasSeed:
    concept_code: str
    raw_name: str
    raw_name_unaccent: str
    expression: str
    is_compound: bool
    component_count: int
    severity: str | None
    course: str | None
    stage: str | None
    dialysis: bool | None
    criteria_text: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class ConditionImportPlan:
    diseases: tuple[CanonicalDiseaseSeed, ...]
    aliases: tuple[DiseaseAliasSeed, ...]
    mapped_mentions: int
    unmapped_mentions: int


@dataclass(frozen=True, slots=True)
class ConditionImportStats:
    disease_count: int
    alias_count: int
    mapped_mentions: int
    unmapped_mentions: int
    applied: bool


def _parse_optional_bool(value: str) -> bool | None:
    normalized = value.strip().casefold()
    if not normalized:
        return None
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    raise ValueError(f"Giá trị boolean không hợp lệ trong CSV: {value!r}")


def _parse_required_bool(value: str) -> bool:
    parsed = _parse_optional_bool(value)
    if parsed is None:
        raise ValueError("Cột boolean bắt buộc không được để trống.")
    return parsed


def read_candidate_rows(path: Path) -> list[dict[str, str]]:
    """Đọc CSV UTF-8 BOM và kiểm tra contract trước khi tạo bất kỳ SQL nào."""
    with path.open(encoding="utf-8-sig", newline="") as file_handle:
        reader = csv.DictReader(file_handle)
        columns = frozenset(reader.fieldnames or ())
        missing = REQUIRED_COLUMNS - columns
        if missing:
            raise ValueError(f"CSV thiếu cột bắt buộc: {', '.join(sorted(missing))}")
        return [{key: value or "" for key, value in row.items()} for row in reader]


def build_import_plan(rows: Sequence[dict[str, str]]) -> ConditionImportPlan:
    """Chuyển CSV thành payload v2 tất định; không truy cập database."""
    if not rows:
        raise ValueError("CSV không có dữ liệu.")

    record_components = Counter(
        row["record_id"]
        for row in rows
        if row["match_status"] == "matched" and row["review_decision"].strip().casefold() != "reject"
    )
    all_records = {row["record_id"] for row in rows}
    mapped_records = set(record_components)
    definitions: dict[str, CanonicalDiseaseSeed] = {}
    aliases: dict[tuple[str, str], DiseaseAliasSeed] = {}

    for row in rows:
        decision = row["review_decision"].strip().casefold()
        if decision not in {"", "approve", "reject"}:
            raise ValueError(
                f"record_id={row['record_id']} có review_decision={row['review_decision']!r}; "
                "hãy sửa trực tiếp đề xuất rồi dùng approve, hoặc dùng reject."
            )
        if row["match_status"] != "matched" or decision == "reject":
            continue
        if row["mapping_status"] != "needs_review":
            raise ValueError(f"mapping_status không hợp lệ tại record_id={row['record_id']}")

        code = row["proposed_concept_code"].strip()
        if code not in CONDITION_CONCEPTS:
            raise ValueError(f"Canonical code ngoài taxonomy tại record_id={row['record_id']}: {code!r}")
        definition = CONDITION_CONCEPTS[code]
        expected = CanonicalDiseaseSeed(
            concept_code=code,
            name=definition.preferred_name_vi,
            name_unaccent=normalize_disease_name(definition.preferred_name_vi),
            body_system=definition.body_system,
            concept_type=definition.concept_type,
        )
        if row["proposed_name_vi"] != expected.name:
            raise ValueError(f"Tên canonical lệch taxonomy tại record_id={row['record_id']}")
        if row["body_system"] != expected.body_system or row["concept_type"] != expected.concept_type:
            raise ValueError(f"Metadata canonical lệch taxonomy tại record_id={row['record_id']}")
        previous = definitions.setdefault(code, expected)
        if previous != expected:
            raise ValueError(f"Canonical code {code!r} có nhiều định nghĩa trong CSV.")

        normalized = row["normalized_mention"].strip()
        if not normalized:
            raise ValueError(f"normalized_mention trống tại record_id={row['record_id']}")
        alias = DiseaseAliasSeed(
            concept_code=code,
            raw_name=row["raw_mention"].strip(),
            raw_name_unaccent=normalized,
            expression=row["expression"].strip(),
            is_compound=_parse_required_bool(row["is_compound"]),
            component_count=record_components[row["record_id"]],
            severity=row["severity"].strip() or None,
            course=row["course"].strip() or None,
            stage=row["stage"].strip() or None,
            dialysis=_parse_optional_bool(row["dialysis"]),
            criteria_text=tuple(value.strip() for value in row["criteria_text"].split("|") if value.strip()),
        )
        alias_key = (code, normalized)
        previous_alias = aliases.setdefault(alias_key, alias)
        if previous_alias != alias:
            raise ValueError(f"Alias {normalized!r} của {code!r} có metadata mâu thuẫn.")

    if not definitions or not aliases:
        raise ValueError("CSV không có mapping hợp lệ để import.")
    return ConditionImportPlan(
        diseases=tuple(sorted(definitions.values(), key=lambda value: value.concept_code)),
        aliases=tuple(sorted(aliases.values(), key=lambda value: (value.raw_name_unaccent, value.concept_code))),
        mapped_mentions=len(mapped_records),
        unmapped_mentions=len(all_records - mapped_records),
    )


def _chunks(values: Sequence[dict[str, Any]], size: int = 500) -> Iterable[Sequence[dict[str, Any]]]:
    for start in range(0, len(values), size):
        yield values[start : start + size]


async def import_condition_catalog(
    session: AsyncSession,
    plan: ConditionImportPlan,
    *,
    apply: bool,
    replace: bool = False,
) -> ConditionImportStats:
    """Upsert catalog/alias v2 trong một transaction; dry-run là mặc định."""
    stats = ConditionImportStats(
        disease_count=len(plan.diseases),
        alias_count=len(plan.aliases),
        mapped_mentions=plan.mapped_mentions,
        unmapped_mentions=plan.unmapped_mentions,
        applied=apply,
    )
    if not apply:
        return stats

    async with session.begin():
        if replace:
            await session.execute(delete(DiseaseAlias).where(DiseaseAlias.version == DISEASE_VERSION_V2))
            await session.execute(update(Disease).where(Disease.version == DISEASE_VERSION_V2).values(is_active=False))

        disease_values = [
            {
                "id": uuid.uuid5(IMPORT_NAMESPACE, f"{DISEASE_VERSION_V2}:disease:{seed.concept_code}"),
                "name": seed.name,
                "name_unaccent": seed.name_unaccent,
                "version": DISEASE_VERSION_V2,
                "concept_code": seed.concept_code,
                "body_system": seed.body_system,
                "concept_type": seed.concept_type,
                "is_active": True,
            }
            for seed in plan.diseases
        ]
        disease_insert = insert(Disease).values(disease_values)
        await session.execute(
            disease_insert.on_conflict_do_update(
                constraint="uq_diseases_version_concept_code",
                set_={
                    "name": disease_insert.excluded.name,
                    "name_unaccent": disease_insert.excluded.name_unaccent,
                    "body_system": disease_insert.excluded.body_system,
                    "concept_type": disease_insert.excluded.concept_type,
                    "is_active": True,
                },
            )
        )
        id_rows = await session.execute(
            select(Disease.concept_code, Disease.id).where(
                Disease.version == DISEASE_VERSION_V2,
                Disease.concept_code.in_([seed.concept_code for seed in plan.diseases]),
            )
        )
        disease_ids = {code: disease_id for code, disease_id in id_rows.all() if code is not None}
        if len(disease_ids) != len(plan.diseases):
            raise RuntimeError("Không resolve đủ canonical disease ID sau upsert.")

        alias_values = [
            {
                "id": uuid.uuid5(
                    IMPORT_NAMESPACE,
                    f"{DISEASE_VERSION_V2}:alias:{seed.concept_code}:{seed.raw_name_unaccent}",
                ),
                "disease_id": disease_ids[seed.concept_code],
                "raw_name": seed.raw_name,
                "raw_name_unaccent": seed.raw_name_unaccent,
                "version": DISEASE_VERSION_V2,
                "expression": seed.expression,
                "is_compound": seed.is_compound,
                "component_count": seed.component_count,
                "severity": seed.severity,
                "course": seed.course,
                "stage": seed.stage,
                "dialysis": seed.dialysis,
                "criteria_text": list(seed.criteria_text),
                "review_status": DISEASE_ALIAS_REVIEW_PENDING,
            }
            for seed in plan.aliases
        ]
        for chunk in _chunks(alias_values):
            alias_insert = insert(DiseaseAlias).values(chunk)
            await session.execute(
                alias_insert.on_conflict_do_update(
                    constraint="uq_disease_aliases_version_disease_raw",
                    set_={
                        "raw_name": alias_insert.excluded.raw_name,
                        "expression": alias_insert.excluded.expression,
                        "is_compound": alias_insert.excluded.is_compound,
                        "component_count": alias_insert.excluded.component_count,
                        "severity": alias_insert.excluded.severity,
                        "course": alias_insert.excluded.course,
                        "stage": alias_insert.excluded.stage,
                        "dialysis": alias_insert.excluded.dialysis,
                        "criteria_text": alias_insert.excluded.criteria_text,
                    },
                )
            )
    return stats


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Import canonical disease catalog v2 vào Supabase.")
    parser.add_argument(
        "--input",
        type=Path,
        default=REPO_ROOT / "dataset" / "condition_normalization_candidates.csv",
    )
    parser.add_argument("--apply", action="store_true", help="Thực sự ghi transaction vào database.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Xóa alias v2 hiện có và đồng bộ lại snapshot; chỉ hợp lệ cùng --apply.",
    )
    return parser


async def _async_main(args: argparse.Namespace) -> None:
    if args.replace and not args.apply:
        raise ValueError("--replace chỉ hợp lệ khi đi cùng --apply")
    input_path = args.input.resolve()
    plan = build_import_plan(read_candidate_rows(input_path))
    async with get_sessionmaker()() as session:
        stats = await import_condition_catalog(session, plan, apply=args.apply, replace=args.replace)
    await dispose_engine()
    mode = "ĐÃ GHI" if stats.applied else "DRY-RUN"
    print(
        f"{mode}: {stats.disease_count} canonical disease v2, {stats.alias_count} alias, "
        f"{stats.mapped_mentions} mention đã map, {stats.unmapped_mentions} mention chưa map."
    )


def main() -> None:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(_async_main(_parser().parse_args()))


if __name__ == "__main__":
    main()
