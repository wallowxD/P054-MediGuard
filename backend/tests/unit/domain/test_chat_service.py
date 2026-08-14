"""Unit test cho ChatService và Pydantic schemas của Chatbot."""

from unittest.mock import AsyncMock

import pytest

from medsafe.schemas.chat import ChatContextSummary, ChatMessage, ChatRequest, ChatResponse
from medsafe.services.chat_service import ChatService


@pytest.mark.asyncio
async def test_chat_schema_validation():
    ctx = ChatContextSummary(
        drugs=["Panadol 500mg", "Ibuprofen 400mg"],
        diseases=["Suy gan"],
        severity_counts={"major": 1},
    )
    req = ChatRequest(
        action="initial",
        context=ctx,
    )
    assert req.action == "initial"
    assert len(req.context.drugs) == 2


@pytest.mark.asyncio
async def test_chat_service_initial_greeting_fallback():
    mock_llm = AsyncMock()
    mock_llm.async_complete.side_effect = Exception("LLM timeout")

    service = ChatService(llm_client=mock_llm)
    ctx = ChatContextSummary(
        drugs=["Panadol", "Ibuprofen"],
        diseases=["Suy gan"],
    )
    req = ChatRequest(action="initial", context=ctx)

    res: ChatResponse = await service.handle_message(req)

    assert isinstance(res, ChatResponse)
    assert "Panadol, Ibuprofen" in res.reply.content
    assert len(res.quick_suggestions) > 0


@pytest.mark.asyncio
async def test_chat_service_initial_greeting_llm_success():
    mock_llm = AsyncMock()
    mock_llm.async_complete.return_value = "Xin chào! Tôi là AI trợ lý. Tôi thấy bạn đang tra cứu Panadol và Ibuprofen."

    service = ChatService(llm_client=mock_llm)
    ctx = ChatContextSummary(
        drugs=["Panadol", "Ibuprofen"],
    )
    req = ChatRequest(action="initial", context=ctx)

    res: ChatResponse = await service.handle_message(req)

    assert "Tôi thấy bạn đang tra cứu Panadol và Ibuprofen" in res.reply.content
    assert res.reply.role == "assistant"


@pytest.mark.asyncio
async def test_chat_service_answer_query():
    mock_llm = AsyncMock()
    mock_llm.async_complete.return_value = (
        "Tương tác giữa hai thuốc này ở mức độ Nguy cơ cao do làm tăng độc tính trên gan."
    )

    service = ChatService(llm_client=mock_llm)
    ctx = ChatContextSummary(drugs=["Panadol", "Ibuprofen"])
    messages = [ChatMessage(role="user", content="Tương tác này nguy hiểm thế nào?")]
    req = ChatRequest(
        action="chat",
        context=ctx,
        messages=messages,
        user_query="Tương tác này nguy hiểm thế nào?",
    )

    res: ChatResponse = await service.handle_message(req)

    assert "Nguy cơ cao" in res.reply.content
    assert res.reply.role == "assistant"
