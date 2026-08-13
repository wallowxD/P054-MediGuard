"""Điểm import tập trung của ORM model.

Alembic autogenerate chỉ thấy model nào đã được import ở đây. Thêm model mới mà quên
dòng import tương ứng sẽ khiến migration sinh ra lệnh xoá bảng.
"""

from medsafe.db.models.disease import (
    DISEASE_ALIAS_REVIEW_APPROVED,
    DISEASE_ALIAS_REVIEW_PENDING,
    DISEASE_ALIAS_REVIEW_REJECTED,
    DISEASE_VERSION_V1,
    DISEASE_VERSION_V2,
    Disease,
    DiseaseAlias,
)
from medsafe.db.models.drug import Drug
from medsafe.db.models.evidence import EvidenceChunk
from medsafe.db.models.interaction import (
    REVIEW_STATUS_APPROVED,
    REVIEW_STATUS_PENDING,
    REVIEW_STATUS_REJECTED,
    SEVERITY_VALUES,
    SOURCE_TYPE_VALUES,
    DrugDiseaseInteraction,
    DrugDrugInteraction,
    DrugFoodInteraction,
    DrugSupplementInteraction,
    Supplement,
)
from medsafe.db.models.interaction_history import InteractionCheck, InteractionCheckEntry
from medsafe.db.models.oauth_identity import PROVIDER_GOOGLE, OAuthIdentity
from medsafe.db.models.patient import (
    CONDITION_BREASTFEEDING,
    CONDITION_CODES,
    CONDITION_HEPATIC_IMPAIRMENT,
    CONDITION_PREGNANT,
    CONDITION_RENAL_IMPAIRMENT,
    CONDITION_SOURCES,
    LEGACY_CONDITION_CODES,
    SEX_VALUES,
    SOURCE_PHARMACIST_CONFIRMED,
    SOURCE_SELF_REPORTED,
    SPECIAL_CONDITION_CODES,
    PatientCondition,
    PatientDisease,
    PatientProfile,
)
from medsafe.db.models.user import ALLOWED_ROLES, ROLE_PATIENT, ROLE_PHARMACIST, User

__all__ = [
    "ALLOWED_ROLES",
    "CONDITION_BREASTFEEDING",
    "CONDITION_CODES",
    "CONDITION_HEPATIC_IMPAIRMENT",
    "CONDITION_PREGNANT",
    "CONDITION_RENAL_IMPAIRMENT",
    "CONDITION_SOURCES",
    "LEGACY_CONDITION_CODES",
    "DISEASE_ALIAS_REVIEW_APPROVED",
    "DISEASE_ALIAS_REVIEW_PENDING",
    "DISEASE_ALIAS_REVIEW_REJECTED",
    "DISEASE_VERSION_V1",
    "DISEASE_VERSION_V2",
    "PROVIDER_GOOGLE",
    "REVIEW_STATUS_APPROVED",
    "REVIEW_STATUS_PENDING",
    "REVIEW_STATUS_REJECTED",
    "ROLE_PATIENT",
    "ROLE_PHARMACIST",
    "SEVERITY_VALUES",
    "SEX_VALUES",
    "SPECIAL_CONDITION_CODES",
    "SOURCE_PHARMACIST_CONFIRMED",
    "SOURCE_SELF_REPORTED",
    "SOURCE_TYPE_VALUES",
    "Disease",
    "DiseaseAlias",
    "Drug",
    "DrugDiseaseInteraction",
    "DrugDrugInteraction",
    "DrugFoodInteraction",
    "DrugSupplementInteraction",
    "EvidenceChunk",
    "OAuthIdentity",
    "PatientCondition",
    "PatientDisease",
    "PatientProfile",
    "InteractionCheck",
    "InteractionCheckEntry",
    "Supplement",
    "User",
]
