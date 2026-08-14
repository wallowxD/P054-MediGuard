"""Kiểm thử offline cho validation ảnh và ánh xạ kết quả Gemini sang catalog."""

from io import BytesIO
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from PIL import Image

from medsafe.config import PrescriptionExtractionConfig
from medsafe.domain.prescription_extraction import (
    InvalidPrescriptionImageError,
    PrescriptionExtractionTimeoutError,
    PrescriptionExtractionUnavailableError,
    PrescriptionImageInput,
    PrescriptionImageLimitError,
    prepare_prescription_image,
)
from medsafe.llm.llm_client import GeminiRateLimitError, GeminiUnavailableError
from medsafe.schemas.prescription_extraction import (
    ModelExtractedDisease,
    ModelExtractedDrug,
    ModelPrescriptionExtraction,
)
from medsafe.services.prescription_extraction_service import PrescriptionExtractionService


def _image_bytes(image_format: str = "JPEG", *, size: tuple[int, int] = (16, 12)) -> bytes:
    output = BytesIO()
    Image.new("RGB", size, color=(245, 245, 240)).save(output, format=image_format)
    return output.getvalue()


def _config(**overrides: object) -> PrescriptionExtractionConfig:
    values: dict[str, object] = {
        "model": "gemini-3.5-flash-lite",
        "max_files": 5,
        "max_file_size_bytes": 10 * 1024 * 1024,
        "max_total_size_bytes": 25 * 1024 * 1024,
        "max_pixels": 40_000_000,
        "candidate_limit": 5,
        "timeout_seconds": 30,
    }
    values.update(overrides)
    return PrescriptionExtractionConfig(**values)


def test_prepare_prescription_image_validates_and_reencodes() -> None:
    source = _image_bytes()

    prepared = prepare_prescription_image(
        PrescriptionImageInput(data=source, declared_mime_type="image/jpeg"),
        max_file_size_bytes=1024 * 1024,
        max_pixels=1_000_000,
    )

    assert prepared.mime_type == "image/jpeg"
    assert (prepared.width, prepared.height) == (16, 12)
    with Image.open(BytesIO(prepared.data)) as decoded:
        assert decoded.format == "JPEG"


@pytest.mark.parametrize(
    ("data", "mime_type"),
    [
        (b"not-an-image", "image/jpeg"),
        (_image_bytes("PNG"), "image/jpeg"),
        (_image_bytes(), "application/pdf"),
    ],
)
def test_prepare_prescription_image_rejects_invalid_or_mismatched_content(data: bytes, mime_type: str) -> None:
    with pytest.raises(InvalidPrescriptionImageError):
        prepare_prescription_image(
            PrescriptionImageInput(data=data, declared_mime_type=mime_type),
            max_file_size_bytes=1024 * 1024,
            max_pixels=1_000_000,
        )


def test_prepare_prescription_image_rejects_pixel_limit() -> None:
    with pytest.raises(PrescriptionImageLimitError):
        prepare_prescription_image(
            PrescriptionImageInput(data=_image_bytes(size=(20, 20)), declared_mime_type="image/jpeg"),
            max_file_size_bytes=1024 * 1024,
            max_pixels=399,
        )


@pytest.mark.asyncio
async def test_service_returns_editable_candidates_without_auto_confirmation() -> None:
    cetirizine_id = uuid4()
    disease_id = uuid4()
    llm = AsyncMock()
    llm.generate_structured_with_images.return_value = ModelPrescriptionExtraction(
        drugs=[
            ModelExtractedDrug(
                raw_text="Cetirizine 10mg (Cetimed 10mg)",
                name="Cetimed 10mg",
                ingredient="Cetirizine",
                uncertain=True,
            ),
            ModelExtractedDrug(
                raw_text="Cetimed 10mg",
                name="Cetimed 10mg",
                ingredient="Cetirizine",
                uncertain=False,
            ),
        ],
        diseases=[
            ModelExtractedDisease(raw_text="Chẩn đoán chính: Viêm da cơ địa", name="Viêm da cơ địa"),
            ModelExtractedDisease(raw_text="Viêm da cơ địa", name="Viêm da cơ địa", uncertain=True),
        ],
    )
    service = PrescriptionExtractionService(AsyncMock(), llm_client=llm, config=_config())
    service.drugs = SimpleNamespace(
        list_catalog_pairs=AsyncMock(return_value=[(cetirizine_id, "Cetimed 10mg", "Cetirizine")])
    )
    service.diseases = SimpleNamespace(
        list_active=AsyncMock(return_value=[SimpleNamespace(id=disease_id, name="Viêm da cơ địa")])
    )

    result = await service.extract([PrescriptionImageInput(data=_image_bytes(), declared_mime_type="image/jpeg")])

    assert result.requires_confirmation is True
    assert result.model == "gemini-3.5-flash-lite"
    assert len(result.drugs) == 1
    assert result.drugs[0].uncertain is False
    assert result.drugs[0].candidates[0].drug_id == cetirizine_id
    assert len(result.diseases) == 1
    assert result.diseases[0].candidates[0].disease_id == disease_id
    llm.generate_structured_with_images.assert_awaited_once()


@pytest.mark.asyncio
async def test_service_maps_provider_timeout_and_failure_to_safe_errors() -> None:
    image = PrescriptionImageInput(data=_image_bytes(), declared_mime_type="image/jpeg")
    timeout_llm = AsyncMock()
    timeout_llm.generate_structured_with_images.side_effect = TimeoutError
    timeout_service = PrescriptionExtractionService(AsyncMock(), llm_client=timeout_llm, config=_config())

    with pytest.raises(PrescriptionExtractionTimeoutError):
        await timeout_service.extract([image])

    failed_llm = AsyncMock()
    failed_llm.generate_structured_with_images.side_effect = ValueError("invalid model output")
    failed_service = PrescriptionExtractionService(AsyncMock(), llm_client=failed_llm, config=_config())

    with pytest.raises(PrescriptionExtractionUnavailableError):
        await failed_service.extract([image])


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("provider_error", "expected_message"),
    [
        (GeminiRateLimitError(), "vượt giới hạn lượt gọi"),
        (GeminiUnavailableError(), "đang quá tải"),
    ],
)
async def test_service_explains_provider_capacity_errors(provider_error: Exception, expected_message: str) -> None:
    image = PrescriptionImageInput(data=_image_bytes(), declared_mime_type="image/jpeg")
    llm = AsyncMock()
    llm.generate_structured_with_images.side_effect = provider_error
    service = PrescriptionExtractionService(AsyncMock(), llm_client=llm, config=_config())

    with pytest.raises(PrescriptionExtractionUnavailableError, match=expected_message):
        await service.extract([image])
