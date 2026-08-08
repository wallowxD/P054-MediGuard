"""Route danh mục thuốc — MỎNG: validate → domain/repository → schema.

Hai cách vào danh mục, khác nhau ở cơ chế khớp:
- `GET /drugs` — duyệt A–Z, lọc chuỗi con TẤT ĐỊNH, có phân trang.
- `GET /drugs/search` — khớp mờ để người dùng chọn đúng thuốc trước khi kiểm tra tương tác.
"""

from math import ceil

from fastapi import APIRouter, Query

from medsafe.api.dependencies import DrugRepositoryDep
from medsafe.config import get_catalog_config
from medsafe.domain.catalog import NON_ALPHA_LETTER, build_letter_index
from medsafe.domain.normalization import search_catalog
from medsafe.schemas.drug import (
    DrugCandidate,
    DrugLetterCount,
    DrugLetterIndexResponse,
    DrugListItem,
    DrugListResponse,
    DrugSearchResponse,
)

router = APIRouter()

_catalog_config = get_catalog_config()
# `letter` nhận A–Z (không phân biệt hoa thường) hoặc "other" cho tên bắt đầu bằng số/ký tự.
_LETTER_PATTERN = rf"^([A-Za-z]|{NON_ALPHA_LETTER})$"


@router.get("", response_model=DrugListResponse)
async def list_drugs(
    drug_repository: DrugRepositoryDep,
    letter: str | None = Query(
        None,
        pattern=_LETTER_PATTERN,
        description='Lọc theo chữ cái đầu của tên biệt dược: "A"–"Z", hoặc "other" cho tên không bắt đầu bằng chữ cái',
    ),
    q: str | None = Query(None, max_length=200, description="Lọc chuỗi con trên tên biệt dược hoặc hoạt chất"),
    page: int = Query(1, ge=1, description="Số trang, bắt đầu từ 1"),
    page_size: int = Query(
        _catalog_config.page_size_default,
        ge=1,
        le=_catalog_config.page_size_max,
        alias="pageSize",
        description="Số dòng mỗi trang",
    ),
) -> DrugListResponse:
    """Duyệt danh mục thuốc theo chữ cái, có phân trang.

    Khác `/drugs/search`: endpoint này lọc TẤT ĐỊNH bằng chuỗi con, không chấm điểm khớp
    mờ — người dùng đang duyệt danh mục nên phải thấy đúng nội dung bảng `drugs`.
    """
    trimmed_query = q.strip() if q else ""
    normalized_letter = letter.lower() if letter else None

    drugs, total = await drug_repository.list_catalog_page(
        letter=normalized_letter,
        query=trimmed_query or None,
        offset=(page - 1) * page_size,
        limit=page_size,
    )

    # Trả về đúng dạng hiển thị trên thanh A–Z để FE so sánh trực tiếp với nút đang chọn.
    if normalized_letter is None or normalized_letter == NON_ALPHA_LETTER:
        echoed_letter = normalized_letter
    else:
        echoed_letter = normalized_letter.upper()

    items = [
        DrugListItem(
            id=str(drug.id),
            brand_name=drug.brand_name,
            ingredient=drug.ingredient_raw,
            dosage_form=drug.dosage_form,
            route=drug.route,
            has_leaflet=bool(drug.leaflet_url),
        )
        for drug in drugs
    ]

    return DrugListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=ceil(total / page_size),
        letter=echoed_letter,
        query=trimmed_query or None,
    )


@router.get("/letters", response_model=DrugLetterIndexResponse)
async def list_drug_letters(drug_repository: DrugRepositoryDep) -> DrugLetterIndexResponse:
    """Đếm số thuốc theo từng chữ cái để dựng thanh A–Z.

    ⚠️ Route tĩnh phải khai báo TRƯỚC `/{drug_id}` khi endpoint chi tiết được thêm vào,
    nếu không "letters" sẽ bị bắt như một drug_id và trả 404/422.
    """
    counts_by_first_char = await drug_repository.count_by_first_letter()
    letters = build_letter_index(counts_by_first_char)

    return DrugLetterIndexResponse(
        letters=[DrugLetterCount(letter=item.letter, count=item.count) for item in letters],
        total=sum(item.count for item in letters),
    )


@router.get("/search", response_model=DrugSearchResponse)
async def search_drugs(
    drug_repository: DrugRepositoryDep,
    q: str = Query(..., min_length=1, max_length=200, description="Từ khoá tên biệt dược hoặc hoạt chất"),
    limit: int = Query(10, ge=1, le=20, description="Số lượng ứng viên tối đa trả về"),
) -> DrugSearchResponse:
    """Tra cứu danh mục thuốc qua `DrugRepository` và `domain/normalization.py`.

    Ưu tiên khớp tên biệt dược: gõ một ký tự đã phải ra danh sách gợi ý, vì đây là ô
    autocomplete chứ không phải nút submit.
    """
    trimmed_query = q.strip()
    if not trimmed_query:
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
