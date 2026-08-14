"""Service điều phối logic cho Chatbot AI."""

from datetime import UTC, datetime

from medsafe.config import get_llm_config
from medsafe.llm.llm_client import LLMClient
from medsafe.prompts.chat_prompts import (
    CHAT_QA_PROMPT,
    CHAT_QA_SYSTEM,
    CHAT_SAFETY_PREAMBLE,
    INITIAL_GREETING_PROMPT,
    INITIAL_GREETING_SYSTEM,
)
from medsafe.schemas.chat import ChatMessage, ChatRequest, ChatResponse


class ChatService:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_config = get_llm_config()
        self.llm = llm_client or LLMClient(model=self.llm_config.model)

    async def handle_message(self, payload: ChatRequest) -> ChatResponse:
        context_json = payload.context.model_dump_json(by_alias=True, indent=2)

        if payload.action == "initial" or not payload.user_query:
            return await self._generate_initial_greeting(payload, context_json)

        return await self._answer_user_query(payload, context_json)

    async def _generate_initial_greeting(self, payload: ChatRequest, context_json: str) -> ChatResponse:
        drugs_str = ", ".join(payload.context.drugs) if payload.context.drugs else "các thuốc đã chọn"
        diseases_str = f" (Bệnh nền: {', '.join(payload.context.diseases)})" if payload.context.diseases else ""

        fallback_greeting = (
            f"Xin chào! Tôi thấy bạn đang tra cứu tương tác giữa **{drugs_str}**{diseases_str}.\n\n"
            f"Hệ thống đã phân tích dữ liệu an toàn có sẵn. Bạn cần tôi giải thích thêm về kết quả này hoặc giải đáp thắc mắc gì không?"
        )

        greeting_content = fallback_greeting
        try:
            prompt = INITIAL_GREETING_PROMPT.format(context_json=context_json)
            result = await self.llm.async_complete(
                prompt=prompt,
                system=INITIAL_GREETING_SYSTEM,
                timeout_seconds=self.llm_config.timeout_seconds,
            )
            if result and result.strip():
                greeting_content = result.strip()
        except Exception:
            greeting_content = fallback_greeting

        quick_suggestions = [
            "Giải thích chi tiết các cảnh báo trong lượt này",
            "Có lưu ý gì khi ăn uống hoặc dùng TPBS không?",
            "Các mức độ nghiêm trọng có ý nghĩa gì?",
        ]

        return ChatResponse(
            reply=ChatMessage(
                role="assistant",
                content=greeting_content,
                created_at=datetime.now(UTC),
            ),
            quick_suggestions=quick_suggestions,
        )

    async def _answer_user_query(self, payload: ChatRequest, context_json: str) -> ChatResponse:
        history_lines = []
        for msg in payload.messages:
            prefix = "Người dùng" if msg.role == "user" else "Trợ lý AI"
            history_lines.append(f"{prefix}: {msg.content}")
        chat_history = "\n".join(history_lines) if history_lines else "Chưa có hội thoại trước."

        user_query = payload.user_query or ""

        fallback_reply = "Hiện tại hệ thống AI đang bận. Bạn vui lòng thử đặt lại câu hỏi hoặc tham khảo trực tiếp các thông tin trích dẫn trên bảng kết quả."

        reply_content = fallback_reply
        try:
            prompt = CHAT_QA_PROMPT.format(
                safety_preamble=CHAT_SAFETY_PREAMBLE,
                context_json=context_json,
                chat_history=chat_history,
                user_query=user_query,
            )
            result = await self.llm.async_complete(
                prompt=prompt,
                system=CHAT_QA_SYSTEM,
                timeout_seconds=self.llm_config.timeout_seconds,
            )
            if result and result.strip():
                reply_content = result.strip()
        except Exception:
            reply_content = fallback_reply

        quick_suggestions = [
            "Trích dẫn này nằm ở tài liệu nào?",
            "Tôi có cần gặp bác sĩ ngay không?",
        ]

        return ChatResponse(
            reply=ChatMessage(
                role="assistant",
                content=reply_content,
                created_at=datetime.now(UTC),
            ),
            quick_suggestions=quick_suggestions,
        )
