"""Test unit cho ORM Model DrugDiseaseInteraction và logic chuẩn hóa tên bệnh nền.

Đảm bảo tuân thủ các nguyên tắc an toàn thuốc (ADR 0006: verbatim_quote) và tính toàn vẹn của model.
"""

from medsafe.db.models import DrugDiseaseInteraction
from medsafe.domain.normalization import normalize_for_matching, remove_vietnamese_accents


def test_drug_disease_interaction_instantiation():
    """Kiểm tra khởi tạo DrugDiseaseInteraction đầy đủ các thuộc tính bắt buộc."""
    disease_raw = "Suy gan nặng"
    disease_unaccent = remove_vietnamese_accents(disease_raw).lower().strip()
    norm_ingredient = normalize_for_matching("Acarbose 50mg")

    interaction = DrugDiseaseInteraction(
        canonical_ingredient=norm_ingredient,
        disease_name=disease_raw,
        disease_name_unaccent=disease_unaccent,
        severity="contraindicated",
        effect_description="Tăng nguy cơ suy gan nặng do tích lũy thuốc",
        management="Chống chỉ định dùng cho bệnh nhân suy gan nặng",
        verbatim_quote="Chống chỉ định Acarbose cho bệnh nhân suy gan nặng hoặc xơ gan.",
        source_type="national_database",
        review_status="approved",
    )

    assert interaction.canonical_ingredient == "acarbose"
    assert interaction.disease_name == "Suy gan nặng"
    assert interaction.disease_name_unaccent == "suy gan nang"
    assert interaction.severity == "contraindicated"
    assert interaction.verbatim_quote != ""
    assert "DrugDiseaseInteraction" in repr(interaction)
    assert "acarbose" in repr(interaction)
