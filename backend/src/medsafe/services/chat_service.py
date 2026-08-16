"""Service điều phối logic cho Chatbot AI.

Chatbot dùng được ở mọi trang, nên mỗi lượt phải xác định `scope` trước rồi mới chọn
prompt: nguồn nào được phép trích khác nhau hoàn toàn giữa ba scope (xem docstring của
`medsafe.prompts.chat_prompts`). Không có ngữ cảnh KHÔNG rơi về "trả lời tự do" — nó rơi
về scope `general`, nơi mọi dữ kiện thuốc đều bị cấm.
"""

from datetime import UTC, datetime

from medsafe.config import get_llm_config
from medsafe.llm.llm_client import LLMClient
from medsafe.prompts.chat_prompts import (
    APP_OVERVIEW,
    CHAT_QA_PROMPT,
    CHAT_QA_SYSTEM,
    CHAT_SAFETY_PREAMBLE,
    DRUG_GREETING_PROMPT,
    DRUG_GREETING_SYSTEM,
    DRUG_QA_PROMPT,
    DRUG_QA_SYSTEM,
    DRUG_SAFETY_PREAMBLE,
    GENERAL_GREETING,
    GENERAL_QA_PROMPT,
    GENERAL_QA_SYSTEM,
    GENERAL_SAFETY_PREAMBLE,
    INITIAL_GREETING_PROMPT,
    INITIAL_GREETING_SYSTEM,
)
from medsafe.schemas.chat import (
    ChatContextSummary,
    ChatDrugContext,
    ChatMessage,
    ChatRequest,
    ChatResponse,
)

INTERACTION_SUGGESTIONS = [
    "Giải thích chi tiết các cảnh báo trong lượt này",
    "Có lưu ý gì khi ăn uống hoặc dùng TPBS không?",
    "Các mức độ nghiêm trọng có ý nghĩa gì?",
]

INTERACTION_FOLLOW_UPS = [
    "Trích dẫn này nằm ở tài liệu nào?",
    "Tôi có cần gặp bác sĩ ngay không?",
]

DRUG_SUGGESTIONS = [
    "Thuốc này chống chỉ định với ai?",
    "Tờ HDSD ghi gì về liều dùng?",
    "Cần thận trọng gì khi dùng thuốc này?",
]

DRUG_FOLLOW_UPS = [
    "Nội dung này nằm ở mục nào của tờ HDSD?",
    "Tra cứu tương tác của thuốc này thế nào?",
]

GENERAL_SUGGESTIONS = [
    "Hệ thống này tra cứu được những gì?",
    "Làm sao để tra cứu tương tác thuốc?",
    "Cảnh báo của hệ thống lấy nguồn từ đâu?",
]

GENERAL_FOLLOW_UPS = [
    "Mức độ nghiêm trọng được phân loại thế nào?",
    '"Đang chờ xác nhận chuyên môn" nghĩa là gì?',
]


class ChatService:
    def __init__(self, llm_client: LLMClient | None = None) -> None:
        self.llm_config = get_llm_config()
        self.llm = llm_client or LLMClient(model=self.llm_config.model)

    async def handle_message(self, payload: ChatRequest) -> ChatResponse:
        """Ngữ cảnh hẹp nhất thắng: lượt tra cứu > tờ HDSD đang mở > không có gì."""
        is_initial = payload.action == "initial" or not payload.user_query

        context = payload.context
        if self._has_interaction_context(context) and context is not None:
            if is_initial:
                return await self._generate_initial_greeting(payload, context)
            return await self._answer_user_query(payload, context)

        drug = payload.drug_context
        if drug is not None:
            if is_initial:
                return await self._generate_drug_greeting(drug)
            return await self._answer_drug_query(payload, drug)

        if is_initial:
            return self._general_greeting()
        return await self._answer_general_query(payload)

    @staticmethod
    def _has_interaction_context(context: ChatContextSummary | None) -> bool:
        """`context` rỗng (client gửi object nhưng chưa tra cứu gì) KHÔNG phải scope
        `interaction`: chạy prompt tương tác trên một JSON trống là ép model tự bịa ra
        thứ để nói.
        """
        return bool(context and (context.check_id or context.drugs or context.items_summary))

    async def _complete(self, *, prompt: str, system: str, fallback: str) -> str:
        """Gọi LLM và luôn có đường lui: chat lỗi thì trả câu dự phòng, không vỡ request."""
        try:
            result = await self.llm.async_complete(
                prompt=prompt,
                system=system,
                timeout_seconds=self.llm_config.timeout_seconds,
            )
        except Exception:
            return fallback
        return result.strip() if result and result.strip() else fallback

    @staticmethod
    def _reply(content: str, suggestions: list[str]) -> ChatResponse:
        return ChatResponse(
            reply=ChatMessage(role="assistant", content=content, created_at=datetime.now(UTC)),
            quick_suggestions=suggestions,
        )

    @staticmethod
    def _format_history(payload: ChatRequest) -> str:
        history_lines = []
        for msg in payload.messages:
            prefix = "Người dùng" if msg.role == "user" else "Trợ lý AI"
            history_lines.append(f"{prefix}: {msg.content}")
        return "\n".join(history_lines) if history_lines else "Chưa có hội thoại trước."

    # -- scope: interaction --------------------------------------------------

    async def _generate_initial_greeting(self, payload: ChatRequest, context: ChatContextSummary) -> ChatResponse:
        del payload  # lời chào chỉ cần ngữ cảnh, không cần lịch sử hội thoại
        context_json = context.model_dump_json(by_alias=True, indent=2)

        drugs_str = ", ".join(context.drugs) if context.drugs else "các thuốc đã chọn"
        diseases_str = f" (Bệnh nền: {', '.join(context.diseases)})" if context.diseases else ""

        fallback_greeting = (
            f"Xin chào! Tôi thấy bạn đang tra cứu tương tác giữa **{drugs_str}**{diseases_str}.\n\n"
            f"Hệ thống đã phân tích dữ liệu an toàn có sẵn. Bạn cần tôi giải thích thêm về kết quả này hoặc giải đáp thắc mắc gì không?"
        )

        greeting = await self._complete(
            prompt=INITIAL_GREETING_PROMPT.format(context_json=context_json),
            system=INITIAL_GREETING_SYSTEM,
            fallback=fallback_greeting,
        )
        return self._reply(greeting, INTERACTION_SUGGESTIONS)

    async def _answer_user_query(self, payload: ChatRequest, context: ChatContextSummary) -> ChatResponse:
        fallback_reply = (
            "Hiện tại hệ thống AI đang bận. Bạn vui lòng thử đặt lại câu hỏi hoặc tham khảo trực tiếp "
            "các thông tin trích dẫn trên bảng kết quả."
        )

        reply = await self._complete(
            prompt=CHAT_QA_PROMPT.format(
                safety_preamble=CHAT_SAFETY_PREAMBLE,
                context_json=context.model_dump_json(by_alias=True, indent=2),
                chat_history=self._format_history(payload),
                user_query=payload.user_query or "",
            ),
            system=CHAT_QA_SYSTEM,
            fallback=fallback_reply,
        )
        return self._reply(reply, INTERACTION_FOLLOW_UPS)

    # -- scope: drug ---------------------------------------------------------

    async def _generate_drug_greeting(self, drug: ChatDrugContext) -> ChatResponse:
        ingredient_str = f" ({drug.ingredient})" if drug.ingredient else ""
        fallback_greeting = (
            f"Xin chào! Bạn đang xem tờ hướng dẫn sử dụng của **{drug.brand_name}**{ingredient_str}.\n\n"
            f"Tôi có thể trích lại nội dung trong tài liệu này để giải thích cho bạn. Bạn muốn hỏi mục nào?"
        )

        greeting = await self._complete(
            prompt=DRUG_GREETING_PROMPT.format(drug_json=drug.model_dump_json(by_alias=True, indent=2)),
            system=DRUG_GREETING_SYSTEM,
            fallback=fallback_greeting,
        )
        return self._reply(greeting, DRUG_SUGGESTIONS)

    async def _answer_drug_query(self, payload: ChatRequest, drug: ChatDrugContext) -> ChatResponse:
        fallback_reply = (
            "Hiện tại hệ thống AI đang bận. Bạn vui lòng thử lại, hoặc đọc trực tiếp các mục nguyên văn "
            "của tờ HDSD đang hiển thị trên trang."
        )

        reply = await self._complete(
            prompt=DRUG_QA_PROMPT.format(
                safety_preamble=DRUG_SAFETY_PREAMBLE,
                drug_json=drug.model_dump_json(by_alias=True, indent=2),
                chat_history=self._format_history(payload),
                user_query=payload.user_query or "",
            ),
            system=DRUG_QA_SYSTEM,
            fallback=fallback_reply,
        )
        return self._reply(reply, DRUG_FOLLOW_UPS)

    # -- scope: general ------------------------------------------------------

    def _general_greeting(self) -> ChatResponse:
        return self._reply(GENERAL_GREETING, GENERAL_SUGGESTIONS)

    async def _answer_general_query(self, payload: ChatRequest) -> ChatResponse:
        fallback_reply = (
            'Hiện tại hệ thống AI đang bận. Trong lúc chờ, bạn có thể mở "Tra cứu thông tin thuốc" để xem '
            'tờ HDSD của một thuốc, hoặc "Tra cứu tương tác thuốc" để đối chiếu nhiều thuốc với nhau.'
        )

        reply = await self._complete(
            prompt=GENERAL_QA_PROMPT.format(
                safety_preamble=GENERAL_SAFETY_PREAMBLE,
                app_overview=APP_OVERVIEW,
                chat_history=self._format_history(payload),
                user_query=payload.user_query or "",
            ),
            system=GENERAL_QA_SYSTEM,
            fallback=fallback_reply,
        )
        return self._reply(reply, GENERAL_FOLLOW_UPS)
