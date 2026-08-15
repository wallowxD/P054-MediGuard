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


class ChatDrugContext(CamelModel):
    """Ngữ cảnh khi người dùng đang mở trang thông tin của MỘT thuốc.

    `sections` là các đoạn NGUYÊN VĂN của tờ HDSD đang hiển thị trên trang (nhãn mục ->
    nội dung), lấy thẳng từ `DrugDetailResponse`. Chatbot chỉ được trả lời trong phạm vi
    các đoạn này; câu hỏi vượt ra ngoài phải trả về "chưa có dữ liệu" thay vì suy đoán.
    """

    drug_id: str
    brand_name: str
    ingredient: str | None = None
    leaflet_url: str | None = None
    sections: dict[str, str] = Field(default_factory=dict)


class ChatRequest(CamelModel):
    """Một lượt chat, kèm ngữ cảnh của màn hình người dùng đang đứng.

    Cả hai trường ngữ cảnh đều optional: chatbot mở được ở MỌI trang, kể cả khi chưa tra
    cứu gì. Thiếu ngữ cảnh không có nghĩa là được tự do suy đoán — service chọn prompt
    theo scope, và scope `general` cấm phát biểu bất kỳ dữ kiện thuốc nào.
    """

    action: Literal["initial", "chat"] = "chat"
    context: ChatContextSummary | None = None
    drug_context: ChatDrugContext | None = None
    messages: list[ChatMessage] = Field(default_factory=list)
    user_query: str | None = None


class ChatResponse(CamelModel):
    reply: ChatMessage
    quick_suggestions: list[str] = Field(default_factory=list)
