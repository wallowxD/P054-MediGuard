"""API hồ sơ sức khoẻ tự khai theo ADR 0017."""

from uuid import UUID

from fastapi import APIRouter, HTTPException, Response, status

from medsafe.api.dependencies import (
    CurrentUserDep,
    DiseaseCatalogRepositoryDep,
    PatientProfileRepositoryDep,
)
from medsafe.db.repositories.patient_profile_repository import PatientProfileRepository
from medsafe.schemas.health import (
    HealthProfileResponse,
    HealthProfileUpdate,
    PatientConditionCreate,
    PatientConditionResponse,
    PatientDiseaseCreate,
    PatientDiseaseResponse,
)

router = APIRouter()


async def _response(repository: PatientProfileRepository, user_id: UUID) -> HealthProfileResponse:
    profile = await repository.get_profile(user_id)
    conditions = await repository.list_conditions(user_id)
    diseases = await repository.list_diseases(user_id)
    return HealthProfileResponse(
        date_of_birth=profile.date_of_birth if profile else None,
        sex=profile.sex if profile else None,
        weight_kg=profile.weight_kg if profile else None,
        height_cm=profile.height_cm if profile else None,
        consented_at=profile.consented_at if profile else None,
        conditions=[PatientConditionResponse.model_validate(value) for value in conditions],
        diseases=[
            PatientDiseaseResponse(
                id=association.id,
                disease_id=disease.id,
                name=disease.name,
                source=association.source,
                created_at=association.created_at,
            )
            for association, disease in diseases
        ],
    )


@router.get("/me/health-profile", response_model=HealthProfileResponse)
async def get_health_profile(user: CurrentUserDep, repository: PatientProfileRepositoryDep) -> HealthProfileResponse:
    return await _response(repository, user.id)


@router.put("/me/health-profile", response_model=HealthProfileResponse)
async def put_health_profile(
    payload: HealthProfileUpdate, user: CurrentUserDep, repository: PatientProfileRepositoryDep
) -> HealthProfileResponse:
    if not payload.consent:
        raise HTTPException(status_code=422, detail="Cần đồng ý lưu dữ liệu sức khoẻ tự khai.")
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
    payload: PatientConditionCreate, user: CurrentUserDep, repository: PatientProfileRepositoryDep
) -> PatientConditionResponse:
    profile = await repository.get_profile(user.id)
    if profile is None or profile.consented_at is None:
        raise HTTPException(status_code=422, detail="Cần lưu đồng ý trước khi thêm tình trạng sức khoẻ.")
    return PatientConditionResponse.model_validate(await repository.add_condition(user.id, payload.condition_code))


@router.delete("/me/conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_condition(
    condition_id: UUID, user: CurrentUserDep, repository: PatientProfileRepositoryDep
) -> Response:
    deleted = await repository.delete_condition(user.id, condition_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Không tìm thấy tình trạng trong hồ sơ của bạn.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/me/diseases", response_model=PatientDiseaseResponse, status_code=status.HTTP_201_CREATED)
async def add_disease(
    payload: PatientDiseaseCreate,
    user: CurrentUserDep,
    profile_repository: PatientProfileRepositoryDep,
    disease_repository: DiseaseCatalogRepositoryDep,
) -> PatientDiseaseResponse:
    profile = await profile_repository.get_profile(user.id)
    if profile is None or profile.consented_at is None:
        raise HTTPException(status_code=422, detail="Cần lưu đồng ý trước khi thêm bệnh nền.")

    disease = await disease_repository.get_by_id(payload.disease_id)
    if disease is None:
        raise HTTPException(status_code=404, detail="Bệnh nền không có trong danh mục đang hoạt động.")

    association = await profile_repository.add_disease(user.id, disease.id)
    return PatientDiseaseResponse(
        id=association.id,
        disease_id=disease.id,
        name=disease.name,
        source=association.source,
        created_at=association.created_at,
    )


@router.delete("/me/diseases/{patient_disease_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_disease(
    patient_disease_id: UUID,
    user: CurrentUserDep,
    repository: PatientProfileRepositoryDep,
) -> Response:
    if not await repository.delete_disease(user.id, patient_disease_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nền trong hồ sơ của bạn.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
