"""Read-only audit cho schema và dữ liệu canonical disease v2 trên database đích."""

import asyncio
import sys

from sqlalchemy import and_, func, inspect, select, text

from medsafe.db.models.disease import DISEASE_VERSION_V2, Disease, DiseaseAlias
from medsafe.db.models.interaction import DrugDiseaseInteraction
from medsafe.db.repositories.disease_catalog_repository import SqlDiseaseCatalogRepository
from medsafe.db.session import dispose_engine, get_engine, get_sessionmaker


async def main_async() -> None:
    async with get_engine().connect() as connection:
        column_metadata = await connection.run_sync(
            lambda sync_connection: [
                (item["name"], str(item["type"]), item["nullable"], item["default"])
                for item in inspect(sync_connection).get_columns("diseases")
            ]
        )
        columns = [item[0] for item in column_metadata]
        constraints = await connection.run_sync(
            lambda sync_connection: [
                item["name"] for item in inspect(sync_connection).get_unique_constraints("diseases")
            ]
        )
        has_alias_table = await connection.run_sync(
            lambda sync_connection: inspect(sync_connection).has_table("disease_aliases")
        )
        version_rows = (
            await connection.execute(text("SELECT version, count(*) FROM diseases GROUP BY version ORDER BY version"))
        ).all()
    print(f"diseases columns: {column_metadata}")
    print(f"diseases unique constraints: {', '.join(value for value in constraints if value)}")
    print(f"diseases versions: {version_rows}")
    print(f"disease_aliases exists: {has_alias_table}")

    if has_alias_table and {"concept_code", "body_system", "concept_type"}.issubset(columns):
        async with get_sessionmaker()() as session:
            canonical_count = int(
                await session.scalar(
                    select(func.count(Disease.id)).where(
                        Disease.version == DISEASE_VERSION_V2,
                        Disease.is_active.is_(True),
                    )
                )
                or 0
            )
            alias_count = int(
                await session.scalar(
                    select(func.count(DiseaseAlias.id)).where(DiseaseAlias.version == DISEASE_VERSION_V2)
                )
                or 0
            )
            mapped_raw_count = int(
                await session.scalar(
                    select(func.count(func.distinct(DiseaseAlias.raw_name_unaccent))).where(
                        DiseaseAlias.version == DISEASE_VERSION_V2
                    )
                )
                or 0
            )
            eligible_alias_count = int(
                await session.scalar(
                    select(func.count(DiseaseAlias.id)).where(
                        DiseaseAlias.version == DISEASE_VERSION_V2,
                        DiseaseAlias.is_compound.is_(False),
                        DiseaseAlias.severity.is_(None),
                        func.jsonb_array_length(DiseaseAlias.criteria_text) == 0,
                    )
                )
                or 0
            )
            exact_interaction_count = int(
                await session.scalar(
                    select(func.count(DrugDiseaseInteraction.id))
                    .select_from(DrugDiseaseInteraction)
                    .join(
                        DiseaseAlias,
                        and_(
                            DiseaseAlias.raw_name_unaccent == DrugDiseaseInteraction.disease_name_unaccent,
                            DiseaseAlias.version == DISEASE_VERSION_V2,
                            DiseaseAlias.is_compound.is_(False),
                            DiseaseAlias.severity.is_(None),
                            func.jsonb_array_length(DiseaseAlias.criteria_text) == 0,
                        ),
                    )
                )
                or 0
            )
            search_smoke = await SqlDiseaseCatalogRepository(session).search("dai thao duong", limit=5)
        print(
            f"v2 data: canonical={canonical_count}, aliases={alias_count}, "
            f"distinct_raw_mentions={mapped_raw_count}, eligible_aliases={eligible_alias_count}, "
            f"exact_interactions={exact_interaction_count}"
        )
        print(f"search smoke 'dai thao duong': {[(value.name, value.version) for value in search_smoke]}")
    await dispose_engine()


def main() -> None:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
