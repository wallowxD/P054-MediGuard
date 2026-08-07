"""Repository — nơi DUY NHẤT được viết truy vấn database."""

from medsafe.db.repositories.disease_repository import DrugDiseaseRepository, SqlDrugDiseaseRepository
from medsafe.db.repositories.drug_interaction_repository import (
    DrugDrugInteractionRepository,
    DrugFoodInteractionRepository,
    SqlDrugDrugInteractionRepository,
    SqlDrugFoodInteractionRepository,
)
from medsafe.db.repositories.drug_repository import DrugRepository, SqlDrugRepository
from medsafe.db.repositories.evidence_chunk_repository import EvidenceChunkRepository, SqlEvidenceChunkRepository
from medsafe.db.repositories.user_repository import SqlUserRepository, UserRepository

__all__ = [
    "DrugDiseaseRepository",
    "DrugDrugInteractionRepository",
    "DrugFoodInteractionRepository",
    "DrugRepository",
    "EvidenceChunkRepository",
    "SqlDrugDiseaseRepository",
    "SqlDrugDrugInteractionRepository",
    "SqlDrugFoodInteractionRepository",
    "SqlDrugRepository",
    "SqlEvidenceChunkRepository",
    "SqlUserRepository",
    "UserRepository",
]
