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

from medsafe.db.models import patient as patient_models
from medsafe.db.models.patient import (
    CONDITION_CODES,
    CONDITION_SOURCES,
    SEX_VALUES,
    SOURCE_SELF_REPORTED,
)
from medsafe.db.repositories import disease_catalog_repository, disease_repository
from medsafe.domain import normalization
from medsafe.domain.normalization import normalize_disease_name

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


def test_both_repositories_share_one_normalization_function():
    """Danh mục và `drug_disease_interactions` phải dùng CHUNG MỘT hàm, không phải hai bản giống nhau.

    Kiểm tra bằng danh tính object chứ không so kết quả trên vài chuỗi mẫu: hai bản sao
    của cùng công thức sẽ cho kết quả giống nhau ở mọi ví dụ test nghĩ ra được, rồi lệch
    đúng vào ngày một bên được sửa. Ai viết lại công thức inline sẽ làm test này chết vì
    module không còn tham chiếu tới hàm chung nữa.
    """
    assert disease_catalog_repository.normalize_disease_name is normalization.normalize_disease_name
    assert disease_repository.normalize_disease_name is normalization.normalize_disease_name


def test_disease_repository_does_not_reimplement_normalization():
    """Chặn việc quay lại gọi thẳng `remove_vietnamese_accents` cho tên bệnh."""
    source = Path(disease_repository.__file__).read_text(encoding="utf-8")
    assert "remove_vietnamese_accents" not in source


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


def _check_expression(column: str, values: tuple[str, ...]) -> str:
    """Dựng lại nguyên văn biểu thức CHECK từ hằng số Python."""
    return f"{column} IN ({', '.join(repr(v) for v in values)})"


@pytest.mark.parametrize(
    ("column", "values"),
    [
        ("condition_code", CONDITION_CODES),
        ("sex", SEX_VALUES),
        ("source", CONDITION_SOURCES),
    ],
)
def test_model_constants_match_migration_check_constraints(column: str, values: tuple[str, ...]):
    """Hằng số Python và CHECK constraint của database phải nói cùng một tập giá trị.

    So khớp NGUYÊN CẢ BIỂU THỨC chứ không tìm từng giá trị rời. Tìm rời thì một giá trị
    chỉ nằm trong comment cũng làm test xanh, mà comment thì không chặn được INSERT nào.
    Cách này còn bắt được cả trường hợp CHECK constraint có thừa một giá trị mà hằng số
    Python không biết.
    """
    expression = _check_expression(column, values)

    assert expression in MIGRATION_PATH.read_text(encoding="utf-8"), f"migration 0005 thiếu CHECK: {expression}"
    assert expression in Path(patient_models.__file__).read_text(encoding="utf-8"), (
        f"model patient.py thiếu CHECK: {expression}"
    )


def test_condition_source_defaults_to_self_reported():
    """Mặc định phải là tự khai — `pharmacist_confirmed` chỉ do dược sĩ đặt tường minh."""
    assert SOURCE_SELF_REPORTED == "self_reported"
    assert CONDITION_SOURCES[0] == SOURCE_SELF_REPORTED
