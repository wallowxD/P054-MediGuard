"""Đọc và xoá lịch sử snapshot, không tra database interaction hay gọi Gemini."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Response, status

from medsafe.api.dependencies import CurrentUserDep, SessionDep
from medsafe.db.repositories.history_repository import SqlInteractionHistoryRepository
from medsafe.schemas.interactions import (
    DiseaseSnapshot,
    DrugSnapshot,
    InteractionCheckListResponse,
    InteractionCheckResponse,
    InteractionCheckSummary,
    InteractionItem,
    InteractionNote,
    SeverityScaleItem,
    UnavailableResult,
)
from medsafe.services.interaction_check_service import SEVERITY_LABELS, SEVERITY_ORDER

router = APIRouter()


@router.get("", response_model=InteractionCheckListResponse)
async def list_checks(
    user: CurrentUserDep,
    session: SessionDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100, alias="pageSize"),
) -> InteractionCheckListResponse:
    rows, total = await SqlInteractionHistoryRepository(session).list_for_user(
        user.id, offset=(page - 1) * page_size, limit=page_size
    )
    items = []
    for row in rows:
        highest = next((value for value in SEVERITY_ORDER if row.severity_counts.get(value, 0)), None)
        items.append(
            InteractionCheckSummary(
                id=row.id,
                drug_names=[value["brandName"] for value in row.drug_snapshot],
                disease_names=[value["name"] for value in row.disease_snapshot],
                checked_at=row.created_at,
                result_count=row.result_count,
                note_count=row.note_count,
                unavailable_count=row.unavailable_count,
                highest_severity=highest,
            )
        )
    return InteractionCheckListResponse(items=items, total=total)


@router.get("/{check_id}", response_model=InteractionCheckResponse)
async def get_check(check_id: UUID, user: CurrentUserDep, session: SessionDep) -> InteractionCheckResponse:
    found = await SqlInteractionHistoryRepository(session).get_for_user(check_id, user.id)
    if found is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt tra cứu.")
    check, entries = found
    items = [InteractionItem.model_validate(value.payload) for value in entries if value.entry_type == "interaction"]
    notes = [InteractionNote.model_validate(value.payload) for value in entries if value.entry_type == "note"]
    unavailable = [
        UnavailableResult.model_validate(value.payload) for value in entries if value.entry_type == "unavailable"
    ]
    highlight = min(items, key=lambda value: (SEVERITY_ORDER.index(value.severity), value.id), default=None)
    return InteractionCheckResponse(
        check_id=check.id,
        history_status="saved",
        checked_at=check.created_at,
        drugs=[DrugSnapshot.model_validate(value) for value in check.drug_snapshot],
        diseases=[DiseaseSnapshot.model_validate(value) for value in check.disease_snapshot],
        severity_scale=[
            SeverityScaleItem(
                severity=value, label=SEVERITY_LABELS[value], result_count=check.severity_counts.get(value, 0)
            )
            for value in SEVERITY_ORDER
        ],
        highlight_id=highlight.id if highlight else None,
        items=items,
        notes=notes,
        unavailable=unavailable,
    )


@router.delete("/{check_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_check(check_id: UUID, user: CurrentUserDep, session: SessionDep) -> Response:
    if not await SqlInteractionHistoryRepository(session).delete_for_user(check_id, user.id):
        raise HTTPException(status_code=404, detail="Không tìm thấy lượt tra cứu.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_checks(user: CurrentUserDep, session: SessionDep) -> Response:
    await SqlInteractionHistoryRepository(session).clear_for_user(user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
