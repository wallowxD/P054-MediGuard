"""Danh mục bệnh nền đóng cho autocomplete."""

from fastapi import APIRouter, Query

from medsafe.api.dependencies import CurrentUserDep, DiseaseCatalogRepositoryDep
from medsafe.schemas.health import DiseaseResponse, DiseaseSearchResponse

router = APIRouter()


@router.get("", response_model=DiseaseSearchResponse)
async def search_diseases(
    _: CurrentUserDep,
    repository: DiseaseCatalogRepositoryDep,
    q: str = Query("", max_length=200),
    limit: int = Query(10, ge=1, le=20),
) -> DiseaseSearchResponse:
    diseases = (
        await repository.search(q.strip(), limit=limit) if q.strip() else (await repository.list_active())[:limit]
    )
    return DiseaseSearchResponse(items=[DiseaseResponse(id=value.id, name=value.name) for value in diseases])
