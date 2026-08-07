"""Điểm import tập trung của ORM model.

Alembic autogenerate chỉ thấy model nào đã được import ở đây. Thêm model mới mà quên
dòng import tương ứng sẽ khiến migration sinh ra lệnh xoá bảng.
"""

from medsafe.db.models.drug import Drug
from medsafe.db.models.evidence import EvidenceChunk
from medsafe.db.models.interaction import (
    REVIEW_STATUS_APPROVED,
    REVIEW_STATUS_PENDING,
    REVIEW_STATUS_REJECTED,
    SEVERITY_VALUES,
    SOURCE_TYPE_VALUES,
    DrugDrugInteraction,
    DrugFoodInteraction,
)
from medsafe.db.models.oauth_identity import PROVIDER_GOOGLE, OAuthIdentity
from medsafe.db.models.user import ALLOWED_ROLES, ROLE_PATIENT, ROLE_PHARMACIST, User

__all__ = [
    "ALLOWED_ROLES",
    "PROVIDER_GOOGLE",
    "REVIEW_STATUS_APPROVED",
    "REVIEW_STATUS_PENDING",
    "REVIEW_STATUS_REJECTED",
    "ROLE_PATIENT",
    "ROLE_PHARMACIST",
    "SEVERITY_VALUES",
    "SOURCE_TYPE_VALUES",
    "Drug",
    "DrugDrugInteraction",
    "DrugFoodInteraction",
    "EvidenceChunk",
    "OAuthIdentity",
    "User",
]
