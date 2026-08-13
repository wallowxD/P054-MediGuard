"""Upload ảnh đơn thuốc tạm thời và trả candidate chưa xác nhận."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from medsafe.api.dependencies import CurrentUserDep, SessionDep
from medsafe.config import get_prescription_extraction_config
from medsafe.domain.prescription_extraction import PrescriptionImageInput, PrescriptionImageLimitError
from medsafe.schemas.prescription_extraction import PrescriptionExtractionResponse
from medsafe.services.prescription_extraction_service import PrescriptionExtractionService

router = APIRouter()


def get_prescription_extraction_service(session: SessionDep) -> PrescriptionExtractionService:
    return PrescriptionExtractionService(session)


PrescriptionExtractionServiceDep = Annotated[
    PrescriptionExtractionService,
    Depends(get_prescription_extraction_service),
]


@router.post("/extract", response_model=PrescriptionExtractionResponse)
async def extract_prescription_images(
    _: CurrentUserDep,
    service: PrescriptionExtractionServiceDep,
    images: Annotated[list[UploadFile], File(description="1–5 ảnh JPG, PNG hoặc WEBP của cùng một đơn thuốc")],
) -> PrescriptionExtractionResponse:
    """Ảnh chỉ sống trong request; Gemini output vẫn phải được người dùng xác nhận với catalog."""
    config = get_prescription_extraction_config()
    if not images or len(images) > config.max_files:
        raise PrescriptionImageLimitError(f"Cần từ 1 đến {config.max_files} ảnh đơn thuốc.")

    inputs: list[PrescriptionImageInput] = []
    total_bytes = 0
    try:
        for image in images:
            data = await image.read(config.max_file_size_bytes + 1)
            total_bytes += len(data)
            if len(data) > config.max_file_size_bytes:
                raise PrescriptionImageLimitError("Mỗi ảnh đơn thuốc không được vượt quá 10 MB.")
            if total_bytes > config.max_total_size_bytes:
                raise PrescriptionImageLimitError("Tổng dung lượng ảnh không được vượt quá 25 MB.")
            inputs.append(PrescriptionImageInput(data=data, declared_mime_type=image.content_type or ""))
    finally:
        for image in images:
            await image.close()

    return await service.extract(inputs)
