"""Structured model output và response candidate cho ảnh đơn thuốc."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from medsafe.schemas.base import CamelModel


class ModelExtractedDrug(BaseModel):
    raw_text: str = Field(min_length=1, max_length=500)
    name: str = Field(min_length=1, max_length=200)
    ingredient: str | None = Field(default=None, max_length=300)
    uncertain: bool = False


class ModelExtractedDisease(BaseModel):
    raw_text: str = Field(min_length=1, max_length=500)
    name: str = Field(min_length=1, max_length=200)
    uncertain: bool = False


class ModelPrescriptionExtraction(BaseModel):
    drugs: list[ModelExtractedDrug] = Field(default_factory=list, max_length=30)
    diseases: list[ModelExtractedDisease] = Field(default_factory=list, max_length=20)


class PrescriptionDrugCandidate(CamelModel):
    drug_id: UUID
    brand_name: str
    ingredient: str
    confidence: float = Field(ge=0, le=100)


class PrescriptionDiseaseCandidate(CamelModel):
    disease_id: UUID
    name: str
    confidence: float = Field(ge=0, le=100)


class ExtractedPrescriptionDrug(CamelModel):
    raw_text: str
    name: str
    ingredient: str | None = None
    uncertain: bool
    candidates: list[PrescriptionDrugCandidate]


class ExtractedPrescriptionDisease(CamelModel):
    raw_text: str
    name: str
    uncertain: bool
    candidates: list[PrescriptionDiseaseCandidate]


class PrescriptionExtractionResponse(CamelModel):
    drugs: list[ExtractedPrescriptionDrug]
    diseases: list[ExtractedPrescriptionDisease]
    model: str
    requires_confirmation: Literal[True] = True
