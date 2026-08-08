"""Toàn bộ SQL liên quan tới `drugs`. Không viết query ở route hay ở domain.

Protocol `DrugRepository` là ranh giới để tầng API/Domain không phụ thuộc SQLAlchemy trực tiếp;
unit test override dependency bằng một implementation in-memory nên chạy được mà không cần database thật.
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.drug import Drug
from medsafe.domain.catalog import NON_ALPHA_LETTER
from medsafe.domain.normalization import remove_vietnamese_accents
from medsafe.domain.pairing import MAX_DRUGS_PER_CHECK


def build_catalog_conditions(letter: str | None, query: str | None) -> list[ColumnElement[bool]]:
    """Dựng điều kiện WHERE cho danh mục thuốc — dùng chung cho query đếm và query lấy trang.

    Lọc tất định bằng LIKE, không dùng similarity: đây là thao tác duyệt danh mục, người
    dùng phải thấy đúng những gì có trong bảng `drugs`.
    """
    conditions: list[ColumnElement[bool]] = []

    if letter == NON_ALPHA_LETTER:
        # `!~` là toán tử regex của PostgreSQL. Nhóm này chỉ có vài dòng nên việc index
        # btree không phục vụ được biểu thức này không đáng kể.
        conditions.append(Drug.brand_name_unaccent.op("!~")("^[a-z]"))
    elif letter:
        # `brand_name_unaccent` do ingestion sinh ra và luôn viết thường (xem
        # ingestion/pipeline.py), nên so khớp chữ thường là đủ và vẫn dùng được index
        # idx_drugs_brand_unaccent.
        conditions.append(Drug.brand_name_unaccent.startswith(letter.lower(), autoescape=True))

    if query:
        # Tên biệt dược khớp trên cột đã bỏ dấu để gõ không dấu vẫn ra kết quả; hoạt chất
        # khớp trên chuỗi gốc viết thường vì bảng không có cột unaccent cho ingredient_raw.
        # autoescape xử lý `%` và `_` do người dùng nhập — danh mục có tên như
        # "A.T Ketoconazole 2%" nên đây không phải trường hợp lý thuyết.
        brand_needle = remove_vietnamese_accents(query).lower()
        conditions.append(
            or_(
                Drug.brand_name_unaccent.contains(brand_needle, autoescape=True),
                func.lower(Drug.ingredient_raw).contains(query.lower(), autoescape=True),
            )
        )

    return conditions


class DrugRepository(Protocol):
    """Cổng truy cập dữ liệu danh mục thuốc."""

    async def list_catalog_pairs(self) -> list[tuple[UUID, str, str]]: ...

    async def list_catalog_page(
        self,
        *,
        letter: str | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 40,
    ) -> tuple[list[Drug], int]: ...

    async def count_by_first_letter(self) -> dict[str, int]: ...

    async def get_by_id(self, drug_id: UUID) -> Drug | None: ...

    async def get_by_ids(self, drug_ids: list[UUID]) -> list[Drug]: ...


class SqlDrugRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_catalog_pairs(self) -> list[tuple[UUID, str, str]]:
        """Trả danh sách tuple (id, brand_name, ingredient_raw) của tất cả thuốc trong danh mục.

        Phục vụ cho `domain/normalization.py` match_drug() và giúp API search gán drugId ổn định.
        """
        stmt = select(Drug.id, Drug.brand_name, Drug.ingredient_raw)
        result = await self._session.execute(stmt)
        return [(row[0], row[1], row[2]) for row in result.all()]

    async def list_catalog_page(
        self,
        *,
        letter: str | None = None,
        query: str | None = None,
        offset: int = 0,
        limit: int = 40,
    ) -> tuple[list[Drug], int]:
        """Trả một trang danh mục kèm tổng số dòng khớp bộ lọc.

        Trả cả `total` trong cùng một lần gọi vì UI phân trang cần biết số trang ngay từ
        request đầu tiên; tách thành hai endpoint sẽ khiến hai con số lệch nhau khi dữ
        liệu đổi giữa hai lần gọi.
        """
        conditions = build_catalog_conditions(letter, query)

        count_stmt = select(func.count()).select_from(Drug).where(*conditions)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        # Sắp xếp phụ theo `id` để phân trang ổn định: danh mục có nhiều biệt dược trùng
        # tên, nếu chỉ ORDER BY tên thì thứ tự giữa các dòng bằng điểm là không xác định
        # và một bản ghi có thể xuất hiện ở cả hai trang liền nhau.
        page_stmt = (
            select(Drug).where(*conditions).order_by(Drug.brand_name_unaccent, Drug.id).offset(offset).limit(limit)
        )
        result = await self._session.execute(page_stmt)
        return list(result.scalars().all()), total

    async def count_by_first_letter(self) -> dict[str, int]:
        """Đếm số thuốc theo ký tự đầu của tên đã bỏ dấu.

        Đếm trong PostgreSQL chứ không kéo 1500 dòng về rồi đếm bằng Python: thanh A–Z
        được gọi ở mỗi lần mở trang danh mục. Việc gộp ký tự thành nhóm A–Z là logic
        thuần nên nằm ở `domain/catalog.py`, không nằm trong SQL.
        """
        first_char = func.left(Drug.brand_name_unaccent, 1)
        stmt = select(first_char, func.count()).group_by(first_char)
        result = await self._session.execute(stmt)
        return {row[0]: int(row[1]) for row in result.all()}

    async def get_by_id(self, drug_id: UUID) -> Drug | None:
        return await self._session.get(Drug, drug_id)

    async def get_by_ids(self, drug_ids: list[UUID]) -> list[Drug]:
        """Batch lookup danh sách thuốc theo IDs, giới hạn tối đa MAX_DRUGS_PER_CHECK (20)."""
        if not drug_ids:
            return []
        bounded_ids = drug_ids[:MAX_DRUGS_PER_CHECK]
        stmt = select(Drug).where(Drug.id.in_(bounded_ids))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
