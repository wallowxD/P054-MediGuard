# ADR 0013 — Topology dữ liệu cloud, OCR và model

- **Trạng thái:** Được chấp nhận; phần deployment có thể được thay khi chốt VPS
- **Ngày:** 2026-08-03
- **Thay thế:** lựa chọn production storage/vector/vision trong ADR 0002

## Bối cảnh

Sơ đồ ban đầu trộn request-time với offline ingestion, vẽ `DB`, `PostgreSQL` và `Supabase`
như ba store, dùng trang `qwen.ai/home` như API và cho LLM sinh “query command”. Các điểm
này tạo nhiều nguồn sự thật và có thể phá exact-pair boundary.

## Quyết định

| Trách nhiệm | Thành phần | Ranh giới |
|---|---|---|
| Web | Next.js | UI; deployment production đang chờ quyết định VPS |
| API | FastAPI | Validate, authorization, typed API |
| Relational truth | Supabase PostgreSQL | Catalog, canonical pairs, citations, evidence versions, review |
| Raw OCR artifact | Private Supabase Storage | Artifact có version; metadata trong PostgreSQL |
| Semantic index | Qdrant Cloud | Vector + payload tối thiểu để resolve evidence ID |
| OCR đơn thuốc | Gemini adapter | Chỉ sinh candidate; user phải xác nhận catalog ID |
| OCR leaflet | Qwen OCR qua Alibaba Model Studio | Batch ingestion; không gọi `qwen.ai/home` |
| Orchestration | LangGraph workflow xác định trước | Chỉ gọi typed tool; model không sinh SQL |
| Language model | GPT-4o qua `llm/llm_client.py` | Structured extraction/grounded presentation; không quyết định existence/severity |

### Tại thời điểm request

Input text hoặc OCR candidate → catalog normalization → user xác nhận stable ID →
LangGraph chọn exact pair cho drug-drug hoặc scoped Qdrant retrieval cho drug-food → resolve
authoritative evidence trong PostgreSQL → citation validation → warning hoặc unavailable.

### Ingestion offline

Catalog version mới → review diff → tải PDF → Qwen OCR → lưu raw artifact private → chunk
nguyên văn + coordinate → embeddings/Qdrant → validate pair/evidence → PostgreSQL.

Qdrant hit chỉ là candidate pointer; phải resolve evidence version trước khi hiển thị.

## Hệ quả

- ✅ Một relational owner, một semantic index.
- ✅ Tách OCR request-time khỏi OCR ingestion.
- ✅ Model/vector sai không vượt qua pair/citation validation.
- ❌ Phải reconcile PostgreSQL, Storage và Qdrant.
- ❌ Cần privacy review riêng cho upload OCR.
- ❌ Production VPS topology, reverse proxy, backup và rollback chưa được chốt.
