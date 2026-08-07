"""Route danh mục thuốc — MỎNG: validate → domain/repository → schema.

Endpoint tra cứu thuốc trong danh mục để người dùng chọn đúng thuốc trước khi kiểm tra tương tác.
"""

from fastapi import APIRouter, Query

from medsafe.api.dependencies import DrugRepositoryDep
from medsafe.domain.normalization import search_catalog
from medsafe.schemas.drug import DrugCandidate, DrugSearchResponse

router = APIRouter()


@router.get("/search", response_model=DrugSearchResponse)
async def search_drugs(
    drug_repository: DrugRepositoryDep,
    q: str = Query(..., min_length=1, max_length=200, description="Từ khoá tên biệt dược hoặc hoạt chất"),
    limit: int = Query(10, ge=1, le=20, description="Số lượng ứng viên tối đa trả về"),
) -> DrugSearchResponse:
    """Tra cứu danh mục thuốc tất định qua `DrugRepository` và `domain/normalization.py`."""
    trimmed_query = q.strip()
    if len(trimmed_query) < 2:
        return DrugSearchResponse(
            query=trimmed_query,
            candidates=[],
            requires_confirmation=False,
        )

    catalog = await drug_repository.list_catalog_pairs()
    scored_candidates, requires_confirmation = search_catalog(trimmed_query, catalog, limit=limit)

    candidates = [
        DrugCandidate(
            drug_id=c.drug_id,
            brand_name=c.brand_name,
            ingredient=c.ingredient,
            confidence=c.confidence,
        )
        for c in scored_candidates
    ]

    return DrugSearchResponse(
        query=trimmed_query,
        candidates=candidates,
        requires_confirmation=requires_confirmation,
    )
