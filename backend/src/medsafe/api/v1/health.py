"""API hồ sơ sức khoẻ tự khai theo ADR 0017."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status

from medsafe.api.dependencies import CurrentUserDep, SessionDep
from medsafe.db.repositories.patient_profile_repository import SqlPatientProfileRepository
from medsafe.schemas.health import (
    HealthProfileResponse,
    HealthProfileUpdate,
    PatientConditionCreate,
    PatientConditionResponse,
)

router = APIRouter()


async def _response(repository: SqlPatientProfileRepository, user_id: UUID) -> HealthProfileResponse:
    profile = await repository.get_profile(user_id)
    conditions = await repository.list_conditions(user_id)
    return HealthProfileResponse(
        date_of_birth=profile.date_of_birth if profile else None,
        sex=profile.sex if profile else None,
        weight_kg=profile.weight_kg if profile else None,
        height_cm=profile.height_cm if profile else None,
        consented_at=profile.consented_at if profile else None,
        conditions=[PatientConditionResponse.model_validate(value) for value in conditions],
    )


@router.get("/me/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(user: CurrentUserDep, session: SessionDep) -> HealthProfileResponse:
    return await _response(SqlPatientProfileRepository(session), user.id)


@router.put("/me/health-profile", response_model=HealthProfileResponse)
async def put_health_profile(
    payload: HealthProfileUpdate, user: CurrentUserDep, session: SessionDep
) -> HealthProfileResponse:
    if not payload.consent:
        raise HTTPException(status_code=422, detail="Cần đồng ý lưu dữ liệu sức khoẻ tự khai.")
    repository = SqlPatientProfileRepository(session)
    await repository.record_consent(user.id)
    await repository.upsert_profile(
        user.id,
        date_of_birth=payload.date_of_birth,
        sex=payload.sex,
        weight_kg=payload.weight_kg,
        height_cm=payload.height_cm,
    )
    return await _response(repository, user.id)


@router.post("/me/conditions", response_model=PatientConditionResponse, status_code=status.HTTP_201_CREATED)
async def add_condition(
    payload: PatientConditionCreate, user: CurrentUserDep, session: SessionDep
) -> PatientConditionResponse:
    repository = SqlPatientProfileRepository(session)
    profile = await repository.get_profile(user.id)
    if profile is None or profile.consented_at is None:
        raise HTTPException(status_code=422, detail="Cần lưu đồng ý trước khi thêm tình trạng sức khoẻ.")
    return PatientConditionResponse.model_validate(await repository.add_condition(user.id, payload.condition_code))


@router.delete("/me/conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_condition(condition_id: UUID, user: CurrentUserDep, session: SessionDep) -> Response:
    deleted = await SqlPatientProfileRepository(session).delete_condition(user.id, condition_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Không tìm thấy tình trạng trong hồ sơ của bạn.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
