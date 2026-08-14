"""Snapshot lịch sử của một lượt tra cứu tương tác tổng hợp."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base


class InteractionCheck(Base):
    __tablename__ = "interaction_checks"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    response_version: Mapped[str] = mapped_column(String(16), nullable=False, server_default="v1")
    drug_snapshot: Mapped[list[dict[str, Any]]] = mapped_column(postgresql.JSONB, nullable=False)
    disease_snapshot: Mapped[list[dict[str, Any]]] = mapped_column(postgresql.JSONB, nullable=False)
    severity_counts: Mapped[dict[str, int]] = mapped_column(postgresql.JSONB, nullable=False)
    summary_status: Mapped[str] = mapped_column(String(32), nullable=False)
    result_count: Mapped[int] = mapped_column(Integer, nullable=False)
    note_count: Mapped[int] = mapped_column(Integer, nullable=False)
    unavailable_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (Index("idx_interaction_checks_user_created", "user_id", "created_at"),)


class InteractionCheckEntry(Base):
    __tablename__ = "interaction_check_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    check_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("interaction_checks.id", ondelete="CASCADE"), nullable=False
    )
    entry_type: Mapped[str] = mapped_column(String(24), nullable=False)
    ordinal: Mapped[int] = mapped_column(Integer, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(postgresql.JSONB, nullable=False)

    __table_args__ = (
        CheckConstraint("entry_type IN ('interaction', 'note', 'unavailable')", name="ck_check_entries_type"),
        UniqueConstraint("check_id", "ordinal", name="uq_check_entries_ordinal"),
        Index("idx_check_entries_check", "check_id"),
    )
