"""Repository — nơi DUY NHẤT được viết truy vấn database."""

from medsafe.db.repositories.disease_catalog_repository import (
    DiseaseCatalogRepository,
    SqlDiseaseCatalogRepository,
    normalize_disease_name,
)
from medsafe.db.repositories.disease_repository import DrugDiseaseRepository, SqlDrugDiseaseRepository
from medsafe.db.repositories.drug_interaction_repository import (
    DrugDrugInteractionRepository,
    DrugFoodInteractionRepository,
    SqlDrugDrugInteractionRepository,
    SqlDrugFoodInteractionRepository,
)
from medsafe.db.repositories.drug_repository import DrugRepository, SqlDrugRepository
from medsafe.db.repositories.evidence_chunk_repository import EvidenceChunkRepository, SqlEvidenceChunkRepository
from medsafe.db.repositories.patient_profile_repository import (
    PatientProfileRepository,
    SqlPatientProfileRepository,
)
from medsafe.db.repositories.user_repository import SqlUserRepository, UserRepository

__all__ = [
    "DiseaseCatalogRepository",
    "DrugDiseaseRepository",
    "DrugDrugInteractionRepository",
    "DrugFoodInteractionRepository",
    "DrugRepository",
    "EvidenceChunkRepository",
    "PatientProfileRepository",
    "SqlDiseaseCatalogRepository",
    "SqlDrugDiseaseRepository",
    "SqlDrugDrugInteractionRepository",
    "SqlDrugFoodInteractionRepository",
    "SqlDrugRepository",
    "SqlEvidenceChunkRepository",
    "SqlPatientProfileRepository",
    "SqlUserRepository",
    "UserRepository",
    "normalize_disease_name",
]
