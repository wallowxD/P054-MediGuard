# Hướng dẫn phát triển backend

Backend là RAG agent tra cứu tương tác thuốc–thuốc và thuốc–thực phẩm có dẫn nguồn. Package
Python là `medsafe`; runtime dùng FastAPI, domain logic deterministic, LangGraph và Qdrant.

> Luôn mở repository root `P-054/`, không mở riêng `backend/`. Thư mục `backend/` chỉ chứa
> source; tài liệu đặt trong `docs/`. Xem context bắt buộc tại [AGENTS.md](../AGENTS.md).

## Chạy nhanh

Mọi lệnh chạy từ repository root:

```bash
uv sync                    # tạo .venv tại root và cài medsafe editable
make run                   # API dev: http://localhost:8000/docs
make test                  # pytest backend/tests
make check                 # ruff + format check + pytest, tương đương CI
make ingest-pilot          # ingestion pilot 50 thuốc
```

Secret nằm trong `.env` tại root. `backend/.env.example` chỉ mô tả tên biến.

## Cấu trúc

```text
backend/
├── pyproject.toml             # dependency và config ruff/pytest
├── config.yaml                # tham số RAG, tuyệt đối không chứa secret
├── Dockerfile                 # build context là repository root
├── src/medsafe/
│   ├── main.py                # create_app, CORS, health
│   ├── config.py              # Settings + config.yaml
│   ├── ingestion/             # batch load/download/extract/store
│   ├── chunking/chunker.py    # giữ nguyên văn và source coordinate
│   ├── embeddings/embedder.py # text → vector
│   ├── vectordb/              # Qdrant protocol và adapter
│   ├── retrieval/             # passage retrieval có scope
│   ├── prompts/               # toàn bộ prompt template
│   ├── llm/llm_client.py      # cửa duy nhất tới model/OCR provider
│   ├── domain/                # pure deterministic logic
│   ├── db/models/             # SQLAlchemy model
│   ├── db/repositories/       # mọi database query
│   ├── agents/                # LangGraph state, node, tool
│   ├── schemas/               # Pydantic I/O, nguồn sinh OpenAPI
│   ├── api/v1/                # thin route
│   └── utils/                 # helper dùng chung
└── tests/
    ├── unit/domain/           # không LLM, database, network
    ├── unit/agents/
    ├── unit/retrieval/
    └── integration/api/
```

## Ranh giới RAG quan trọng nhất

| Câu hỏi | Cơ chế bắt buộc | Lý do |
|---|---|---|
| Drug–drug có tương tác không, mức nào? | `db/repositories/` exact-key lookup + `domain/` deterministic severity | Ingestion đã persist canonical pair có evidence; request path không được đoán |
| Drug–food có evidence không? | `retrieval/` semantic search trong đúng leaflet | Không có lookup table; dữ liệu nằm trong free text |
| Quote hỗ trợ | `retrieval/`/evidence repository | Phải giữ nguyên văn và source coordinate |
| Drug information Q&A | `retrieval/` + prompt chuyên biệt | Bị giới hạn bởi passage nguồn |
| Người dùng gõ sai tên thuốc | `domain/normalization.py` | Character/fuzzy matching phù hợp tên riêng tiếng Việt hơn embedding |

Chỉ với drug–drug, similarity search bị cấm làm cơ sở kết luận. Ví dụ query
Warfarin–Tamoxifen có thể trả record Acenocoumarol–Tamoxifen vì hai cặp gần nhau trong
embedding space. Warning đó có thể có nguồn thật nhưng ghi sai cặp thuốc. Xem
[ADR 0012](../adrs/0012-reviewed-leaflet-interaction-records.md).

## Đặt code đúng lớp

| Hạng mục | Vị trí |
|---|---|
| Endpoint mới | `api/v1/`; route chỉ validate và gọi boundary bên dưới |
| Normalize, severity, pairing | `domain/` |
| Database query | `db/repositories/`; không query trong route |
| Prompt | `prompts/prompt_templates.py`; không viết inline |
| Model/OCR call | `llm/llm_client.py`; không import provider SDK nơi khác |
| Agent node/tool | `agents/` |
| Batch hoặc one-off job | `ingestion/` |
| Chunk/top_k/threshold/model | `config.yaml`; không hardcode |
| Request/response type | `schemas/` dùng Pydantic v2 |

## Quy ước Python

- Python 3.11, ruff line length 120, rule `E,F,I,N,W,UP`.
- Public function bắt buộc có type hint.
- Không dùng bare `except:`; bắt exception cụ thể hoặc để central handler xử lý.
- Pydantic v2 dùng `model_config = SettingsConfigDict(...)`, không dùng `class Config`.
- Dùng absolute import, ví dụ `from medsafe.domain.severity import Severity`.
- Mọi I/O trên request path là async.
- Success response trả typed payload trực tiếp theo ADR 0011; error trả typed problem
  detail/status phù hợp.

## Nhà cung cấp dịch vụ và dữ liệu

- Prescription OCR đi qua Gemini adapter và chỉ tạo candidate chưa tin cậy. Sau OCR vẫn
  phải catalog match và user xác nhận stable ID.
- Leaflet OCR chạy offline qua Qwen adapter với endpoint/model đọc từ config.
- Supabase PostgreSQL sở hữu catalog, exact pair, citation, immutable evidence version và
  review state.
- Private Supabase Storage sở hữu raw OCR artifact có version.
- Qdrant giữ vector và evidence pointer. Mỗi hit phải resolve ngược về PostgreSQL trước khi
  hiển thị.
- Không đưa secret vào `config.yaml`, source, test fixture hoặc log.

## Quy tắc luồng cảnh báo

1. Exact drug–drug record hoặc qualifying drug–food passage phải tồn tại.
2. Citation phải có quote nguyên văn, source URL và stable chunk ID.
3. Pair identity, citation và review status phải cùng `evidenceVersionId`.
4. Severity phải deterministic; `unknown` chỉ dùng cho evidenced record.
5. Thiếu record/citation/source hoặc dưới threshold trả unavailable outcome.
6. `pending` hiển thị ngay; `rejected` không trả patient.
7. Không diagnosis, prescribe, dosing hoặc khuyên tự đổi/ngừng thuốc.

## Kiểm thử

`backend/tests/unit/domain/` phải chạy hoàn toàn offline. Đây là nơi đo normalization,
pairing, severity và wrong-pair regression cho `eval/results/report.md`.

- Mock model/OCR qua fixture trong `conftest.py`; không gọi provider thật trong test.
- Mỗi thay đổi warning path cần regression test.
- Test bị skip phải ghi lý do cụ thể trong `reason=`.
- Integration test xác minh status code, direct payload, validation error và partial result.

## Thêm một endpoint

1. Duyệt requirement và contract trong feature workspace.
2. Viết Pydantic schema và failing test.
3. Implement domain/repository/application behavior.
4. Thêm thin route tại `api/v1/` và register trong `api/routes.py`.
5. Sinh lại `openapi.json` và frontend type; không sửa generated file bằng tay.
6. Chạy `make check`, contract check và quickstart của feature.

## Trạng thái hiện tại

Backend hiện chỉ expose `/health` và `/api/v1/status`; business router vẫn chưa được bật.
Migration Alembic, production logging/observability và backend deployment provider chưa có
quyết định cuối. Không tự đặt convention; tạo/link Jira ticket và ghi ADR khi team duyệt.
