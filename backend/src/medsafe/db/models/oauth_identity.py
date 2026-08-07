"""Bảng `oauth_identities` — liên kết `users` với một danh tính OAuth provider bên ngoài.

Chỉ lưu định danh ĐÃ VERIFY (`sub`, email tại thời điểm đăng nhập gần nhất) — KHÔNG bao giờ
lưu ID token, access token, refresh token hay client secret của provider; những thứ đó chỉ
sống trong một request, xác thực xong là bỏ. Xem ADR 0016.

★ Cùng lý do với `users`: bảng nằm trong schema `public` nên PostgREST của Supabase sẽ
  expose nó cho anon key. Migration bật Row Level Security và không tạo policy nào.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import Mapped, mapped_column

from medsafe.db.base import Base

PROVIDER_GOOGLE = "google"


class OAuthIdentity(Base):
    __tablename__ = "oauth_identities"
    __table_args__ = (
        UniqueConstraint("provider", "provider_subject", name="uq_oauth_identity_provider_subject"),
        {"comment": "Liên kết OAuth. RLS bật, không policy: chỉ backend (role sở hữu) truy cập."},
    )

    id: Mapped[uuid.UUID] = mapped_column(postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        postgresql.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_subject: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    def __repr__(self) -> str:
        return f"<OAuthIdentity id={self.id} provider={self.provider} user_id={self.user_id}>"
