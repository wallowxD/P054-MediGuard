# ADR 0001 — Kiến trúc ba tầng với backend theo pipeline RAG

- **Trạng thái:** Bị thay thế một phần bởi ADR 0013
- **Ngày:** 2026-08-02

## Bối cảnh

Hệ thống gồm web client, API, logic miền, database và pipeline xử lý leaflet. Backend cần
tách rõ request path khỏi batch ingestion để route không chứa business logic và từng tầng
RAG có thể thay thế độc lập.

## Quyết định

Áp dụng ba tầng `presentation → application/domain → infrastructure`. Trong backend, mỗi
giai đoạn RAG có package riêng: ingestion, chunking, embeddings, vectordb, retrieval,
prompts, llm và agents. Route chỉ validate rồi gọi application boundary; SQL chỉ nằm trong
repository; logic thuần nằm trong `domain/`.

## Hệ quả

- ✅ Dễ kiểm thử logic miền không cần network/database/model.
- ✅ Có thể thay vector store hoặc model mà không sửa route/domain.
- ✅ Batch ingestion không làm tăng độ trễ request.
- ❌ Có nhiều module và interface hơn một prototype một file.
- ❌ Team phải giữ kỷ luật dependency direction.

## Phương án đã xem xét

- Một ứng dụng FastAPI monolithic — nhanh ban đầu nhưng khó kiểm thử và thay provider.
- Microservices — quá phức tạp với quy mô và thời gian của dự án.
