# ADR 0002 — Technology stack ban đầu

- **Trạng thái:** Bị thay thế một phần bởi ADR 0013
- **Ngày:** 2026-08-02

## Quyết định ban đầu

| Tầng | Lựa chọn |
|---|---|
| Agent | LangGraph + LangChain |
| RAG | ChromaDB + OpenAI embeddings + pypdf |
| Backend | FastAPI + Uvicorn, Python 3.11 |
| Chuẩn hóa tên | rapidfuzz + unidecode |
| Frontend | Next.js 16 + React 19 + strict TypeScript |
| UI | Tailwind v4 + shadcn/ui |
| Database | PostgreSQL production / SQLite development, SQLAlchemy + Alembic |
| Tooling | uv workspace + ruff + pytest · Yarn 4 |
| DevOps | Docker Compose + GitHub Actions |

Fuzzy matching ký tự được chọn cho tên thuốc tiếng Việt vì mục tiêu là giống chính tả,
không phải gần nghĩa. Root `pyproject.toml` là uv virtual workspace để `.venv` luôn được
tạo tại root, phù hợp hook ghi log.

## Ghi chú thay thế

ADR 0013 thay lựa chọn production database/vector store và chốt topology OCR/model. Các
lựa chọn ngôn ngữ, framework, name matching và toolchain còn lại vẫn có hiệu lực.

## Hệ quả

- ✅ Toolchain thống nhất và sinh OpenAPI cho frontend.
- ✅ Domain test không phụ thuộc dịch vụ ngoài.
- ❌ Cấu hình monorepo hai ngôn ngữ cần tài liệu rõ.
