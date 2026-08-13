"""Unit test offline cho kế hoạch import canonical disease v2."""

import importlib.util
from pathlib import Path
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from sqlalchemy.dialects import postgresql

from medsafe.db.models.disease import DISEASE_VERSION_V2
from medsafe.db.repositories.disease_catalog_repository import SqlDiseaseCatalogRepository
from medsafe.db.repositories.unified_interaction_repository import SqlUnifiedInteractionRepository
from medsafe.ingestion.condition_normalization_import import (
    build_import_plan,
    import_condition_catalog,
    read_candidate_rows,
)

REPO_ROOT = Path(__file__).resolve().parents[4]
CSV_PATH = REPO_ROOT / "dataset" / "condition_normalization_candidates.csv"
MIGRATION_PATH = REPO_ROOT / "backend" / "migrations" / "versions" / "20260813_0007_canonical_disease_v2.py"


def _load_migration() -> ModuleType:
    spec = importlib.util.spec_from_file_location("migration_0007", MIGRATION_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _compiled_sql(statement: object) -> str:
    return str(statement.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))


def test_full_review_artifact_builds_complete_v2_plan() -> None:
    plan = build_import_plan(read_candidate_rows(CSV_PATH))

    assert len(plan.diseases) == 274
    assert len(plan.aliases) == 1884
    assert plan.mapped_mentions == 1267
    assert plan.unmapped_mentions == 1
    assert len({value.concept_code for value in plan.diseases}) == len(plan.diseases)
    assert len({(value.concept_code, value.raw_name_unaccent) for value in plan.aliases}) == len(plan.aliases)


@pytest.mark.asyncio
async def test_import_dry_run_does_not_touch_database() -> None:
    plan = build_import_plan(read_candidate_rows(CSV_PATH))
    session = AsyncMock()

    stats = await import_condition_catalog(session, plan, apply=False)

    assert stats.disease_count == 274
    assert stats.alias_count == 1884
    assert not stats.applied
    session.execute.assert_not_awaited()
    session.scalar.assert_not_awaited()


def test_migration_extends_current_head_and_keeps_v1_default() -> None:
    migration = _load_migration()
    source = MIGRATION_PATH.read_text(encoding="utf-8")

    assert migration.revision == "0007"
    assert migration.down_revision == "0006"
    assert "UPDATE diseases SET version = 'v1' WHERE concept_code IS NULL" in source
    assert "ADD COLUMN IF NOT EXISTS version" in source
    assert "disease_aliases" in source
    assert "ENABLE ROW LEVEL SECURITY" in source


def test_reimport_does_not_reset_human_review_status() -> None:
    source = (REPO_ROOT / "backend" / "src" / "medsafe" / "ingestion" / "condition_normalization_import.py").read_text(
        encoding="utf-8"
    )
    conflict_update = source.split("alias_insert.on_conflict_do_update", maxsplit=1)[1]

    assert '"review_status": alias_insert.excluded.review_status' not in conflict_update


@pytest.mark.asyncio
async def test_catalog_queries_only_active_v2_diseases() -> None:
    statements: list[object] = []
    session = AsyncMock()

    async def capture(statement: object) -> MagicMock:
        statements.append(statement)
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        return result

    session.execute = capture
    repository = SqlDiseaseCatalogRepository(session)

    await repository.list_active()
    await repository.get_by_ids([uuid4()])

    for statement in statements:
        sql = _compiled_sql(statement)
        assert "diseases.version = 'v2'" in sql
        assert "diseases.is_active IS true" in sql


@pytest.mark.asyncio
async def test_unified_lookup_joins_exact_v2_alias_without_similarity() -> None:
    statements: list[object] = []
    session = AsyncMock()

    async def capture(statement: object) -> MagicMock:
        statements.append(statement)
        result = MagicMock()
        result.all.return_value = []
        return result

    session.execute = capture
    disease_id = uuid4()

    result = await SqlUnifiedInteractionRepository(session).find_disease_interactions([("Metformin", disease_id)])

    assert result == []
    sql = _compiled_sql(statements[0])
    assert "JOIN disease_aliases" in sql
    assert "disease_aliases.raw_name_unaccent = drug_disease_interactions.disease_name_unaccent" in sql
    assert f"disease_aliases.disease_id = '{disease_id}'" in sql
    assert f"disease_aliases.version = '{DISEASE_VERSION_V2}'" in sql
    assert "disease_aliases.review_status != 'rejected'" in sql
    assert "disease_aliases.is_compound IS false" not in sql
    assert "disease_aliases.severity IS NULL" not in sql
    assert "jsonb_array_length(disease_aliases.criteria_text)" not in sql
    assert "LIKE" not in sql.upper()
