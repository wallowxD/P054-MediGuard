"""Contract hồ sơ sức khoẻ tự khai và danh mục bệnh nền."""

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import Field

from medsafe.schemas.base import CamelModel


class PatientConditionResponse(CamelModel):
    id: UUID
    condition_code: Literal["mang-thai", "cho-con-bu", "suy-than", "suy-gan"]
    source: Literal["self_reported", "pharmacist_confirmed"]
    created_at: datetime


class HealthProfileResponse(CamelModel):
    date_of_birth: date | None = None
    sex: Literal["nu", "nam", "khac"] | None = None
    weight_kg: Decimal | None = None
    height_cm: Decimal | None = None
    consented_at: datetime | None = None
    conditions: list[PatientConditionResponse] = Field(default_factory=list)


class HealthProfileUpdate(CamelModel):
    date_of_birth: date | None = None
    sex: Literal["nu", "nam", "khac"] | None = None
    weight_kg: Decimal | None = Field(None, gt=0, le=300)
    height_cm: Decimal | None = Field(None, gt=0, le=250)
    consent: bool


class PatientConditionCreate(CamelModel):
    condition_code: Literal["mang-thai", "cho-con-bu", "suy-than", "suy-gan"]


class DiseaseResponse(CamelModel):
    id: UUID
    name: str


class DiseaseSearchResponse(CamelModel):
    items: list[DiseaseResponse]
