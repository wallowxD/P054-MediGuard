"""Kiểm thử contract multipart của API đọc ảnh đơn thuốc; Gemini luôn được mock."""

from io import BytesIO
from types import SimpleNamespace
from uuid import uuid4

import pytest
from httpx import ASGITransport, AsyncClient
from PIL import Image

from medsafe.api.dependencies import get_current_user
from medsafe.api.v1.prescription_extractions import get_prescription_extraction_service
from medsafe.domain.prescription_extraction import PrescriptionExtractionUnavailableError
from medsafe.main import app
from medsafe.schemas.prescription_extraction import (
    ExtractedPrescriptionDisease,
    ExtractedPrescriptionDrug,
    PrescriptionDiseaseCandidate,
    PrescriptionDrugCandidate,
    PrescriptionExtractionResponse,
)


def _jpeg() -> bytes:
    output = BytesIO()
    Image.new("RGB", (20, 20), color="white").save(output, format="JPEG")
    return output.getvalue()


@pytest.fixture
def extraction_service():
    drug_id = uuid4()
    disease_id = uuid4()
    service = SimpleNamespace()

    async def extract(images):
        service.received = images
        return PrescriptionExtractionResponse(
            drugs=[
                ExtractedPrescriptionDrug(
                    raw_text="Cetimed 10mg",
                    name="Cetimed 10mg",
                    ingredient="Cetirizine",
                    uncertain=False,
                    candidates=[
                        PrescriptionDrugCandidate(
                            drug_id=drug_id,
                            brand_name="Cetimed 10mg",
                            ingredient="Cetirizine",
                            confidence=100,
                        )
                    ],
                )
            ],
            diseases=[
                ExtractedPrescriptionDisease(
                    raw_text="Viêm da cơ địa",
                    name="Viêm da cơ địa",
                    uncertain=False,
                    candidates=[
                        PrescriptionDiseaseCandidate(disease_id=disease_id, name="Viêm da cơ địa", confidence=100)
                    ],
                )
            ],
            model="gemini-3.5-flash-lite",
        )

    service.extract = extract
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid4())
    app.dependency_overrides[get_prescription_extraction_service] = lambda: service
    yield service
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_extract_prescription_accepts_multipart_and_returns_candidates(extraction_service) -> None:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/prescriptions/extract",
            files=[("images", ("don-thuoc.jpg", _jpeg(), "image/jpeg"))],
        )

    assert response.status_code == 200
    body = response.json()
    assert body["requiresConfirmation"] is True
    assert body["drugs"][0]["name"] == "Cetimed 10mg"
    assert body["drugs"][0]["candidates"][0]["brandName"] == "Cetimed 10mg"
    assert body["diseases"][0]["candidates"][0]["name"] == "Viêm da cơ địa"
    assert extraction_service.received[0].declared_mime_type == "image/jpeg"
    assert extraction_service.received[0].data


@pytest.mark.asyncio
async def test_extract_prescription_rejects_more_than_five_images(extraction_service) -> None:
    transport = ASGITransport(app=app)
    files = [("images", (f"don-{index}.jpg", _jpeg(), "image/jpeg")) for index in range(6)]
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/prescriptions/extract", files=files)

    assert response.status_code == 413
    assert response.json()["code"] == "prescription_image_limit"


@pytest.mark.asyncio
async def test_extract_prescription_returns_typed_provider_error(extraction_service) -> None:
    async def unavailable(_images):
        raise PrescriptionExtractionUnavailableError("Không thể đọc ảnh lúc này.")

    extraction_service.extract = unavailable
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/prescriptions/extract",
            files=[("images", ("don-thuoc.jpg", _jpeg(), "image/jpeg"))],
        )

    assert response.status_code == 503
    assert response.json() == {
        "code": "prescription_extraction_unavailable",
        "message": "Không thể đọc ảnh lúc này.",
    }
