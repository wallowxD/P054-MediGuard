"""Lưu và đọc snapshot lịch sử, luôn ràng buộc theo user_id."""

from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.interaction_history import InteractionCheck, InteractionCheckEntry


class SqlInteractionHistoryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def save(
        self,
        *,
        user_id: UUID,
        drugs: list[dict[str, Any]],
        diseases: list[dict[str, Any]],
        severity_counts: dict[str, int],
        summary_status: str,
        items: list[dict[str, Any]],
        notes: list[dict[str, Any]],
        unavailable: list[dict[str, Any]],
    ) -> InteractionCheck:
        check = InteractionCheck(
            user_id=user_id,
            drug_snapshot=drugs,
            disease_snapshot=diseases,
            severity_counts=severity_counts,
            summary_status=summary_status,
            result_count=len(items),
            note_count=len(notes),
            unavailable_count=len(unavailable),
        )
        self._session.add(check)
        await self._session.flush()
        entries: list[InteractionCheckEntry] = []
        for ordinal, (entry_type, payload) in enumerate(
            [("interaction", item) for item in items]
            + [("note", note) for note in notes]
            + [("unavailable", value) for value in unavailable]
        ):
            entries.append(
                InteractionCheckEntry(check_id=check.id, entry_type=entry_type, ordinal=ordinal, payload=payload)
            )
        self._session.add_all(entries)
        await self._session.commit()
        await self._session.refresh(check)
        return check

    async def list_for_user(self, user_id: UUID, *, offset: int, limit: int) -> tuple[list[InteractionCheck], int]:
        total = int(
            (
                await self._session.execute(
                    select(func.count()).select_from(InteractionCheck).where(InteractionCheck.user_id == user_id)
                )
            ).scalar_one()
        )
        result = await self._session.execute(
            select(InteractionCheck)
            .where(InteractionCheck.user_id == user_id)
            .order_by(InteractionCheck.created_at.desc(), InteractionCheck.id)
            .offset(offset)
            .limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_for_user(
        self, check_id: UUID, user_id: UUID
    ) -> tuple[InteractionCheck, list[InteractionCheckEntry]] | None:
        result = await self._session.execute(
            select(InteractionCheck).where(InteractionCheck.id == check_id, InteractionCheck.user_id == user_id)
        )
        check = result.scalar_one_or_none()
        if check is None:
            return None
        entries = list(
            (
                await self._session.execute(
                    select(InteractionCheckEntry)
                    .where(InteractionCheckEntry.check_id == check_id)
                    .order_by(InteractionCheckEntry.ordinal)
                )
            )
            .scalars()
            .all()
        )
        return check, entries

    async def delete_for_user(self, check_id: UUID, user_id: UUID) -> bool:
        result = await self._session.execute(
            delete(InteractionCheck).where(InteractionCheck.id == check_id, InteractionCheck.user_id == user_id)
        )
        await self._session.commit()
        return bool(result.rowcount)

    async def clear_for_user(self, user_id: UUID) -> int:
        result = await self._session.execute(delete(InteractionCheck).where(InteractionCheck.user_id == user_id))
        await self._session.commit()
        return int(result.rowcount or 0)
