"""API Chatbot Trợ lý Tra cứu Tương tác Thuốc."""

from fastapi import APIRouter, HTTPException, status

from medsafe.api.dependencies import CurrentUserDep
from medsafe.schemas.chat import ChatRequest, ChatResponse
from medsafe.services.chat_service import ChatService

router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def chat_message(payload: ChatRequest, user: CurrentUserDep) -> ChatResponse:
    """Xử lý hội thoại chat AI gắn với context tra cứu tương tác."""
    del user
    try:
        service = ChatService()
        return await service.handle_message(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể xử lý tin nhắn chat lúc này. Vui lòng thử lại sau.",
        ) from exc
