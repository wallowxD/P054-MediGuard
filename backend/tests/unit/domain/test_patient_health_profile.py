"""Unit test cho hồ sơ sức khoẻ tự khai và danh mục bệnh nền (VMEC-73).

Chạy hoàn toàn offline: không LLM, không database, không network.

Trọng tâm là hai chỗ dễ trôi mà không có test thì chỉ phát hiện được khi đã chạy thật:

1. Cột `diseases.name_unaccent` được seed bằng giá trị viết sẵn trong migration. Nếu nó
   lệch với công thức chuẩn hoá mà `drug_disease_interactions` dùng, danh mục và bản ghi
   tương tác không join được — người dùng chọn đúng bệnh vẫn nhận "chưa có dữ liệu".
2. Hằng số `condition_code`/`sex` trong model phải khớp CHECK constraint của migration;
   lệch nhau thì INSERT hợp lệ theo Python lại chết ở database.
"""

import importlib.util
from pathlib import Path
from types import ModuleType

import pytest

from medsafe.db.models.patient import (
    CONDITION_CODES,
    CONDITION_SOURCES,
    SEX_VALUES,
    SOURCE_SELF_REPORTED,
)
from medsafe.db.repositories.disease_catalog_repository import normalize_disease_name
from medsafe.domain.normalization import remove_vietnamese_accents

MIGRATION_PATH = (
    Path(__file__).resolve().parents[3] / "migrations" / "versions" / "20260811_0005_patient_health_profile.py"
)


def _load_migration() -> ModuleType:
    """Nạp migration như một module rời.

    `migrations/versions/` không phải package nên không import theo tên được; đây là cách
    duy nhất để test đọc trực tiếp dữ liệu seed thay vì chép lại nó (chép lại thì hai bản
    cùng sai vẫn "pass").
    """
    spec = importlib.util.spec_from_file_location("migration_0005", MIGRATION_PATH)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_disease_seed_unaccent_matches_normalization():
    """Giá trị `name_unaccent` viết sẵn phải bằng đúng kết quả của hàm chuẩn hoá."""
    migration = _load_migration()

    for name, unaccent in migration.DISEASE_SEED:
        assert unaccent == normalize_disease_name(name), f"seed lệch chuẩn hoá ở bệnh {name!r}"


def test_disease_catalog_normalization_matches_interaction_convention():
    """Danh mục và `drug_disease_interactions` phải dùng chung một công thức không dấu.

    Công thức của bản ghi tương tác nằm trong `disease_repository.py`:
    `remove_vietnamese_accents(disease_name).lower().strip()`. Test viết lại nguyên văn
    công thức đó để một thay đổi ở `normalize_disease_name` không lặng lẽ tách hai bên ra.
    """
    for name in ("Suy thận mạn", "Đái tháo đường type 2", "  Bệnh phổi tắc nghẽn mạn tính (COPD)  "):
        assert normalize_disease_name(name) == remove_vietnamese_accents(name).lower().strip()


def test_disease_seed_has_no_duplicate_unaccent():
    """`uq_diseases_name_unaccent` sẽ làm migration chết giữa chừng nếu seed có dòng trùng."""
    migration = _load_migration()

    unaccents = [unaccent for _, unaccent in migration.DISEASE_SEED]
    assert len(unaccents) == len(set(unaccents))


@pytest.mark.parametrize(
    ("query", "expected"),
    [
        ("suy than", "suy than"),
        ("Suy Thận", "suy than"),
        ("  Gout  ", "gout"),
        ("", ""),
    ],
)
def test_normalize_disease_name_cases(query: str, expected: str):
    """Gõ không dấu, gõ hoa hay thừa khoảng trắng đều về cùng một khoá so khớp (US3.2)."""
    assert normalize_disease_name(query) == expected


def test_model_constants_match_migration_check_constraints():
    """Hằng số Python và CHECK constraint của database phải nói cùng một tập giá trị."""
    migration_source = MIGRATION_PATH.read_text(encoding="utf-8")

    for code in CONDITION_CODES:
        assert f"'{code}'" in migration_source, f"condition_code {code!r} thiếu trong CHECK constraint"
    for sex in SEX_VALUES:
        assert f"'{sex}'" in migration_source, f"sex {sex!r} thiếu trong CHECK constraint"
    for source in CONDITION_SOURCES:
        assert f"'{source}'" in migration_source, f"source {source!r} thiếu trong CHECK constraint"


def test_condition_source_defaults_to_self_reported():
    """Mặc định phải là tự khai — `pharmacist_confirmed` chỉ do dược sĩ đặt tường minh."""
    assert SOURCE_SELF_REPORTED == "self_reported"
    assert CONDITION_SOURCES[0] == SOURCE_SELF_REPORTED
