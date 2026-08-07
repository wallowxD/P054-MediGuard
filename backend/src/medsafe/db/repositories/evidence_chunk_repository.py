"""Toàn bộ SQL liên quan tới `evidence_chunks`.

Đây là đầu kia của mọi citation: Qdrant chỉ giữ vector cùng con trỏ, còn nội dung hiển thị
cho người dùng phải resolve về đúng dòng trong bảng này (ADR 0013).
"""

from typing import Protocol
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.evidence import EvidenceChunk


class EvidenceChunkRepository(Protocol):
    """Cổng truy cập dữ liệu trích dẫn nguyên văn (evidence chunks)."""

    async def get_by_ids(self, chunk_ids: list[UUID]) -> list[EvidenceChunk]: ...

    async def list_by_drug_and_section(self, drug_id: UUID, section_name: str) -> list[EvidenceChunk]: ...


class SqlEvidenceChunkRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_ids(self, chunk_ids: list[UUID]) -> list[EvidenceChunk]:
        """Resolve con trỏ từ Qdrant về đoạn nguyên văn trong PostgreSQL (ADR 0013).

        Truy vấn batch 1 lần cho toàn bộ list chunk_ids để tránh N+1 queries.
        """
        if not chunk_ids:
            return []
        stmt = select(EvidenceChunk).where(EvidenceChunk.id.in_(chunk_ids))
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def list_by_drug_and_section(self, drug_id: UUID, section_name: str) -> list[EvidenceChunk]:
        """Lấy danh sách chunk theo drug_id và section_name (case-insensitive).

        Dữ liệu thực tế có cả "CHỐNG CHỈ ĐỊNH" lẫn "Chống chỉ định" nên cần dùng func.lower().
        """
        norm_section = section_name.strip().lower()
        stmt = select(EvidenceChunk).where(
            EvidenceChunk.drug_id == drug_id,
            func.lower(EvidenceChunk.section_name) == norm_section,
        ).order_by(EvidenceChunk.chunk_index.asc())

        result = await self._session.execute(stmt)
        return list(result.scalars().all())
