"""Repository — nơi DUY NHẤT được viết truy vấn database."""

from medsafe.db.repositories.disease_repository import DrugDiseaseRepository, SqlDrugDiseaseRepository
from medsafe.db.repositories.user_repository import SqlUserRepository, UserRepository

__all__ = [
    "DrugDiseaseRepository",
    "SqlDrugDiseaseRepository",
    "SqlUserRepository",
    "UserRepository",
]

