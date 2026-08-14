"""Contract API Chatbot Trợ lý Tra cứu Tương tác Thuốc."""

from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from medsafe.schemas.base import CamelModel


class ChatMessage(CamelModel):
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime | None = None


class ChatContextSummary(CamelModel):
    check_id: str | None = None
    drugs: list[str] = Field(default_factory=list)
    diseases: list[str] = Field(default_factory=list)
    severity_counts: dict[str, int] = Field(default_factory=dict)
    highlight_warning: str | None = None
    items_summary: list[dict[str, Any]] = Field(default_factory=list)
    notes_summary: list[dict[str, Any]] = Field(default_factory=list)
    unavailable_summary: list[dict[str, Any]] = Field(default_factory=list)


class ChatRequest(CamelModel):
    action: Literal["initial", "chat"] = "chat"
    context: ChatContextSummary
    messages: list[ChatMessage] = Field(default_factory=list)
    user_query: str | None = None


class ChatResponse(CamelModel):
    reply: ChatMessage
    quick_suggestions: list[str] = Field(default_factory=list)
