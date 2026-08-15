"""Unit test cho ChatService và Pydantic schemas của Chatbot."""

from unittest.mock import AsyncMock

import pytest

from medsafe.schemas.chat import (
    ChatContextSummary,
    ChatDrugContext,
    ChatMessage,
    ChatRequest,
    ChatResponse,
)
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


# -- scope `general`: chatbot mở ở trang chưa tra cứu gì -------------------------


@pytest.mark.asyncio
async def test_general_greeting_needs_no_context_and_no_llm():
    """Mở chat ở trang bất kỳ vẫn có lời chào, không phụ thuộc LLM lẫn lượt tra cứu."""
    mock_llm = AsyncMock()
    service = ChatService(llm_client=mock_llm)

    res: ChatResponse = await service.handle_message(ChatRequest(action="initial"))

    assert "Tra cứu thông tin thuốc" in res.reply.content
    assert len(res.quick_suggestions) > 0
    mock_llm.async_complete.assert_not_awaited()


@pytest.mark.asyncio
async def test_general_query_uses_prompt_that_forbids_drug_claims():
    """Không có ngữ cảnh thì prompt phải cấm model nói dữ kiện thuốc từ trí nhớ của nó."""
    mock_llm = AsyncMock()
    mock_llm.async_complete.return_value = "Bạn hãy mở màn Tra cứu tương tác thuốc nhé."

    service = ChatService(llm_client=mock_llm)
    req = ChatRequest(action="chat", user_query="Warfarin và Aspirin có tương tác không?")

    res: ChatResponse = await service.handle_message(req)

    prompt = mock_llm.async_complete.await_args.kwargs["prompt"]
    assert "TUYỆT ĐỐI không tự phát biểu bất kỳ dữ kiện thuốc nào" in prompt
    assert "Warfarin và Aspirin có tương tác không?" in prompt
    assert res.reply.role == "assistant"


@pytest.mark.asyncio
async def test_empty_context_object_falls_back_to_general_scope():
    """Client gửi context rỗng vẫn phải rơi về `general`, không chạy prompt tương tác."""
    mock_llm = AsyncMock()
    service = ChatService(llm_client=mock_llm)

    res: ChatResponse = await service.handle_message(
        ChatRequest(action="initial", context=ChatContextSummary())
    )

    assert "Tra cứu thông tin thuốc" in res.reply.content
    mock_llm.async_complete.assert_not_awaited()


# -- scope `drug`: người dùng đang đọc tờ HDSD ----------------------------------


@pytest.mark.asyncio
async def test_drug_greeting_fallback_names_the_drug():
    mock_llm = AsyncMock()
    mock_llm.async_complete.side_effect = Exception("LLM timeout")

    service = ChatService(llm_client=mock_llm)
    req = ChatRequest(
        action="initial",
        drug_context=ChatDrugContext(drug_id="d1", brand_name="3B-MEDI", ingredient="vitamin b1"),
    )

    res: ChatResponse = await service.handle_message(req)

    assert "3B-MEDI" in res.reply.content
    assert len(res.quick_suggestions) > 0


@pytest.mark.asyncio
async def test_drug_query_prompt_carries_verbatim_leaflet_sections():
    mock_llm = AsyncMock()
    mock_llm.async_complete.return_value = "Tờ HDSD ghi ở mục Chống chỉ định: \"Quá mẫn với thành phần\"."

    service = ChatService(llm_client=mock_llm)
    req = ChatRequest(
        action="chat",
        drug_context=ChatDrugContext(
            drug_id="d1",
            brand_name="3B-MEDI",
            sections={"Chống chỉ định": "Quá mẫn với một trong các thành phần nào của thuốc."},
        ),
        user_query="Ai không nên dùng thuốc này?",
    )

    res: ChatResponse = await service.handle_message(req)

    prompt = mock_llm.async_complete.await_args.kwargs["prompt"]
    assert "Quá mẫn với một trong các thành phần nào của thuốc." in prompt
    assert "Tờ HDSD của thuốc này không ghi nội dung đó" in prompt
    assert res.reply.role == "assistant"
