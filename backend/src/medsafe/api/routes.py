"""Gom router của v1.

Route phải MỎNG: validate đầu vào → gọi domain/repository → trả schema.
Không viết truy vấn DB và không viết logic nghiệp vụ ở đây.
"""

from fastapi import APIRouter

from medsafe.api.v1 import (
    auth,
    chat,
    diseases,
    drugs,
    health,
    interaction_checks,
    interactions,
    prescription_extractions,
)

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(drugs.router, prefix="/drugs", tags=["drugs"])
router.include_router(diseases.router, prefix="/diseases", tags=["diseases"])
router.include_router(health.router, prefix="/patients", tags=["health-profile"])
router.include_router(interactions.router, prefix="/interactions", tags=["interactions"])
router.include_router(interaction_checks.router, prefix="/interaction-checks", tags=["interaction-history"])
router.include_router(prescription_extractions.router, prefix="/prescriptions", tags=["prescription-extraction"])

# router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
# router.include_router(reviews.router,       prefix="/reviews",       tags=["reviews"])


@router.get("/status", tags=["system"])
async def status() -> dict[str, str]:
    return {"status": "ready", "agent": "Medication Safety Copilot v0.1"}
