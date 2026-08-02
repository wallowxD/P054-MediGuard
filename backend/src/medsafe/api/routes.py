"""Gom router của v1.

Route phải MỎNG: validate đầu vào → gọi domain/repository → trả schema.
Không viết truy vấn DB và không viết logic nghiệp vụ ở đây.
"""

from fastapi import APIRouter

router = APIRouter()

# Bật dần khi từng module sẵn sàng:
# from medsafe.api.v1 import drugs, interactions, prescriptions, reviews
# router.include_router(interactions.router,  prefix="/interactions",  tags=["interactions"])
# router.include_router(drugs.router,         prefix="/drugs",         tags=["drugs"])
# router.include_router(prescriptions.router, prefix="/prescriptions", tags=["prescriptions"])
# router.include_router(reviews.router,       prefix="/reviews",       tags=["reviews"])


@router.get("/status", tags=["system"])
async def status() -> dict[str, str]:
    return {"status": "ready", "agent": "Medication Safety Copilot v0.1"}
