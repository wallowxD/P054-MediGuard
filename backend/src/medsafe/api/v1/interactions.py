"""Tra cứu tương tác tổng hợp."""

from fastapi import APIRouter, HTTPException

from medsafe.api.dependencies import CurrentUserDep, SessionDep
from medsafe.schemas.interactions import InteractionCheckRequest, InteractionCheckResponse
from medsafe.services.interaction_check_service import InteractionCheckService

router = APIRouter()


@router.post("/check", response_model=InteractionCheckResponse)
async def check_interactions(
    payload: InteractionCheckRequest, user: CurrentUserDep, session: SessionDep
) -> InteractionCheckResponse:
    try:
        return await InteractionCheckService(session).check(
            user_id=user.id, drug_ids=payload.drug_ids, disease_ids=payload.disease_ids
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
