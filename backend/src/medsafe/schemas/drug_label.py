"""Pydantic schema cho dữ liệu trích xuất từ HDSD thuốc (VLM structured output)."""

from typing import Literal

from pydantic import BaseModel, Field

SeverityLevel = Literal["nhe", "trung_binh", "nang", "chong_chi_dinh_phoi_hop", "khong_ro"]
ConfidenceLevel = Literal["high", "medium", "low"]


class DrugInteraction(BaseModel):
    thuoc_hoac_nhom: str = Field(description="Tên thuốc hoặc nhóm thuốc gây tương tác")
    muc_do_nghiem_trong: SeverityLevel | None = None
    khuyen_nghi_xu_tri: str | None = None


class DrugLabelExtraction(BaseModel):
    chi_dinh: str | None = None
    chong_chi_dinh: str | None = None
    lieu_dung: str | None = None
    cach_dung: str | None = None
    tuong_tac_thuoc: list[DrugInteraction] = Field(default_factory=list)
    raw_quote: str | None = Field(
        default=None,
        description="Trích nguyên văn 1-2 đoạn quan trọng nhất từ tài liệu để đối chiếu",
    )
    extraction_confidence: ConfidenceLevel
    ghi_chu: str | None = Field(
        default=None, description="Ghi chú nếu tài liệu mờ, thiếu trang, hoặc không rõ"
    )


class DrugLabelRecord(BaseModel):
    row_index: int
    biet_duoc: str
    extraction: DrugLabelExtraction | None
    source_urls: list[str]
    source_local_paths: list[str]
    needs_review: bool
    review_reason: str | None = None
