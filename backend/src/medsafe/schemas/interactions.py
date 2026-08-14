"""Contract tra cứu tương tác tổng hợp và snapshot lịch sử."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import Field, model_validator

from medsafe.schemas.base import CamelModel

Severity = Literal["contraindicated", "major", "moderate", "minor", "unknown"]
InteractionKind = Literal["drug-drug", "drug-disease", "drug-food", "drug-supplement"]


class Citation(CamelModel):
    evidence_id: str
    chunk_id: UUID | None = None
    quote: str
    source: str
    source_url: str
    page: int | None = None
    section: str | None = None


class AISummary(CamelModel):
    status: Literal["generated", "fallback"]
    warning: str
    management_bullets: list[str] = []


class InteractionItem(CamelModel):
    id: str
    kind: InteractionKind
    severity: Severity
    review_status: Literal["pending", "approved"]
    subject: str
    object: str
    pair_key: str | None = None
    mechanism: str | None = None
    consequence: str | None = None
    effect_description: str | None = None
    management: str | None = None
    ai_summary: AISummary
    citations: list[Citation] = Field(min_length=1)


class InteractionNote(InteractionItem):
    kind: Literal["drug-food", "drug-supplement"]


class SeverityScaleItem(CamelModel):
    severity: Severity
    label: str
    result_count: int


class UnavailableResult(CamelModel):
    key: str
    kind: Literal["drug-drug", "drug-disease"]
    subject: str
    object: str
    reason: Literal["missing-record", "missing-citation", "source-unavailable"]


class DrugSnapshot(CamelModel):
    id: UUID
    brand_name: str
    ingredient: str


class DiseaseSnapshot(CamelModel):
    id: UUID
    name: str


class InteractionCheckRequest(CamelModel):
    drug_ids: list[UUID] = Field(min_length=1, max_length=20)
    disease_ids: list[UUID] = Field(max_length=20)

    @model_validator(mode="after")
    def validate_check_scope(self) -> "InteractionCheckRequest":
        if len(set(self.drug_ids)) != len(self.drug_ids):
            raise ValueError("Danh sách thuốc không được trùng lặp.")
        if len(set(self.disease_ids)) != len(self.disease_ids):
            raise ValueError("Danh sách bệnh nền không được trùng lặp.")
        if len(self.drug_ids) < 2 and not self.disease_ids:
            raise ValueError("Cần ít nhất hai thuốc, hoặc một thuốc kèm một bệnh/tình trạng đã xác nhận.")
        return self


class InteractionCheckResponse(CamelModel):
    check_id: UUID | None
    history_status: Literal["saved", "not-saved"]
    checked_at: datetime
    drugs: list[DrugSnapshot]
    diseases: list[DiseaseSnapshot]
    severity_scale: list[SeverityScaleItem]
    highlight_id: str | None
    items: list[InteractionItem]
    notes: list[InteractionNote]
    unavailable: list[UnavailableResult]


class InteractionCheckSummary(CamelModel):
    id: UUID
    drug_names: list[str]
    disease_names: list[str]
    checked_at: datetime
    result_count: int
    note_count: int
    unavailable_count: int
    highest_severity: Severity | None


class InteractionCheckListResponse(CamelModel):
    items: list[InteractionCheckSummary]
    total: int
