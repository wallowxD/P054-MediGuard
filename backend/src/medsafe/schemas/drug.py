"""Schemas I/O cho thuốc và danh mục tìm kiếm thuốc."""

from medsafe.schemas.base import CamelModel


class DrugCandidate(CamelModel):
    """Một ứng viên thuốc trong kết quả tìm kiếm danh mục."""

    drug_id: str
    brand_name: str
    ingredient: str
    confidence: float


class DrugSearchResponse(CamelModel):
    """Kết quả tìm kiếm thuốc trong danh mục (`GET /api/v1/drugs/search`)."""

    query: str
    candidates: list[DrugCandidate]
    requires_confirmation: bool
