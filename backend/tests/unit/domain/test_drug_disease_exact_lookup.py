"""Regression test: tra cứu thuốc–bệnh nền phải là EXACT lookup (VMEC-82).

Cùng loại bảo vệ mà `test_t014_warfarin_tamoxifen_regression` dựng cho thuốc–thuốc: bảng
ranh giới RAG trong AGENTS.md xếp thuốc–bệnh nền vào cột "tra cứu exact key".

Test soi thẳng câu SQL mà repository dựng ra thay vì so kết quả trả về của một fake
in-memory. Bug gốc nằm TRONG SQL — `.contains()` sinh `LIKE '%suy gan%'` — nên một fake
repository tự viết bằng Python sẽ khớp đúng và test vẫn xanh trong khi production sai.

Chạy offline: session được mock, không chạm database.
"""

from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.dialects import postgresql

from medsafe.db.repositories.disease_repository import SqlDrugDiseaseRepository


def _mock_session() -> tuple[AsyncMock, list]:
    """Session giả, ghi lại mọi statement được execute."""
    captured: list = []
    session = AsyncMock()

    async def capture(stmt, *args, **kwargs):
        captured.append(stmt)
        result = MagicMock()
        result.scalars.return_value.all.return_value = []
        return result

    session.execute = capture
    return session, captured


def _compiled_sql(stmt) -> str:
    return str(stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))


@pytest.mark.asyncio
async def test_find_interactions_uses_equality_not_like():
    """Tên bệnh phải so bằng dấu bằng; một chữ LIKE ở đây là trả cảnh báo sai cặp."""
    session, captured = _mock_session()
    repo = SqlDrugDiseaseRepository(session)

    await repo.find_interactions("Metformin", "Suy gan")

    sql = _compiled_sql(captured[0])
    assert "LIKE" not in sql.upper(), f"khớp mờ tên bệnh sẽ trả sai cặp:\n{sql}"
    assert "drug_disease_interactions.disease_name_unaccent = 'suy gan'" in sql, sql


@pytest.mark.asyncio
async def test_find_interactions_matches_ingredient_by_equality_too():
    """Hoạt chất cũng phải exact — sai hoạt chất cũng là sai cặp."""
    session, captured = _mock_session()
    repo = SqlDrugDiseaseRepository(session)

    await repo.find_interactions("Metformin", "Suy gan")

    sql = _compiled_sql(captured[0])
    assert "drug_disease_interactions.canonical_ingredient = 'metformin'" in sql, sql


@pytest.mark.asyncio
async def test_suy_gan_does_not_reach_suy_gan_mat_bu():
    """Kịch bản tái hiện của VMEC-82, diễn đạt bằng chính khoá so khớp.

    "suy gan" là tiền tố của "suy gan mat bu" nên phép so khớp bằng chuỗi con sẽ kéo bản
    ghi kia về. Phép so bằng dấu bằng thì không.
    """
    session, captured = _mock_session()
    repo = SqlDrugDiseaseRepository(session)

    await repo.find_interactions("Metformin", "Suy gan")
    sql = _compiled_sql(captured[0])

    assert "'suy gan mat bu'" not in sql
    assert "'%suy gan%'" not in sql


@pytest.mark.asyncio
async def test_find_interactions_still_filters_by_review_status():
    """Bản ghi `rejected`/`pending_review` không được lọt ra khi chỉ hỏi bản đã duyệt."""
    session, captured = _mock_session()
    repo = SqlDrugDiseaseRepository(session)

    await repo.find_interactions("Metformin", "Suy gan", only_approved=True)
    assert "review_status = 'approved'" in _compiled_sql(captured[0])

    # So trên điều kiện lọc, không so trên cả câu SQL: `review_status` luôn có mặt trong
    # danh sách cột SELECT nên tìm chuỗi trần sẽ khớp nhầm ở đó.
    session2, captured2 = _mock_session()
    await SqlDrugDiseaseRepository(session2).find_interactions("Metformin", "Suy gan", only_approved=False)
    assert "review_status = " not in _compiled_sql(captured2[0])
