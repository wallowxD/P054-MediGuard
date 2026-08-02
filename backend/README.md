# Backend — Medication Safety Copilot

RAG agent tra tương tác **thuốc–thuốc** và **thuốc–thực phẩm** có nguồn.
Package Python: `medsafe` · FastAPI + LangGraph + ChromaDB.

> ⚠️ Luôn mở repo ở thư mục gốc `P-054/`, **không** mở `backend/` làm workspace —
> hook AI logging dùng đường dẫn tương đối từ root, mở sai chỗ là mất log mà không
> có cảnh báo. Xem [AGENTS.md](../AGENTS.md).

---

## Chạy nhanh

Mọi lệnh chạy từ **repo root**, không phải từ `backend/`:

```bash
uv sync                    # tạo .venv ở repo root, cài medsafe dạng editable
make run                   # API dev  -> http://localhost:8000/docs
make test                  # pytest backend/tests
make check                 # lint + format + test (giống CI)
make ingest-pilot          # trích xuất thử 50 thuốc theo PRD
```

Secret nằm ở `.env` tại **repo root** (không phải `backend/.env`).
`backend/.env.example` chỉ để tra tên biến.

---

## Cấu trúc

```
backend/
├── pyproject.toml          deps + cấu hình ruff/pytest (package: medsafe)
├── config.yaml             tham số RAG — KHÔNG chứa secret
├── Dockerfile              build context = REPO ROOT (uv.lock ở workspace root)
├── .env.example            danh sách biến môi trường (giá trị thật để ở root)
├── logs/                   log file, đã gitignore
│
├── src/medsafe/
│   ├── main.py             create_app(), CORS, /health
│   ├── config.py           Settings (đọc .env ở root) + load config.yaml
│   │
│   │   ── RAG pipeline, mỗi bước một thư mục ──
│   ├── ingestion/          nạp dữ liệu thô, chạy BATCH tách khỏi API
│   │   ├── loader.py       đọc drug_list CSV, drugtodrug JSON, tải PDF HDSD
│   │   ├── pipeline.py     load → PDF → text → chunk → embed → store
│   │   └── cli.py          python -m medsafe.ingestion.cli --limit 50
│   ├── chunking/chunker.py     cắt tờ HDSD, GIỮ NGUYÊN VĂN + toạ độ nguồn
│   ├── embeddings/embedder.py  text → vector
│   ├── vectordb/vector_store.py  ChromaDB (Protocol + hiện thực)
│   ├── retrieval/retriever.py    truy hồi đoạn trích  ★ xem ranh giới bên dưới
│   ├── prompts/prompt_templates.py  MỌI prompt ở đây, không viết inline
│   ├── llm/llm_client.py       MỘT cửa duy nhất gọi model
│   │
│   │   ── nghiệp vụ ──
│   ├── domain/             logic THUẦN — không import fastapi/sqlalchemy/openai
│   │   ├── normalization.py    tên thuốc → hoạt chất (khớp mờ)
│   │   ├── severity.py         xếp mức nghiêm trọng (tất định)
│   │   └── pairing.py          N thuốc → C(N,2) cặp cần tra
│   ├── db/
│   │   ├── models/         SQLAlchemy: drug, ingredient, interaction, excerpt, review
│   │   └── repositories/   truy vấn — KHÔNG viết query trong route
│   ├── agents/             LangGraph: graph, state, nodes/, tools/
│   ├── schemas/            Pydantic I/O → nguồn sinh openapi.json
│   ├── api/
│   │   ├── routes.py       gom router
│   │   └── v1/             interactions · drugs · prescriptions · reviews
│   └── utils/helpers.py    tiện ích chung (bỏ dấu, đổi link Drive, id ổn định)
│
└── tests/
    ├── conftest.py
    ├── unit/domain/        chạy KHÔNG cần LLM, DB hay mạng
    ├── unit/agents/
    ├── unit/retrieval/
    └── integration/api/
```

---

## ★ Ranh giới quan trọng nhất

Vai trò của similarity search **khác nhau tuỳ loại tương tác**. Đừng áp một luật chung.

| Câu hỏi | Cơ chế | Vì sao |
|---|---|---|
| Thuốc–thuốc: có tương tác không? Mức nào? | `db/repositories/` + `domain/` — **tra bảng** | `drugtodrug.json` là quan hệ `(A,B) → bản ghi`. Tra khoá chính xác 100% theo định nghĩa |
| **Thuốc–thực phẩm: có tương tác không?** | **`retrieval/`** — tìm kiếm ngữ nghĩa | Không tồn tại bảng tra; thông tin chỉ nằm trong văn bản tự do của tờ HDSD |
| Đoạn trích nguyên văn minh chứng | `retrieval/` | |
| Tra thông tin thuốc (Q&A) | `retrieval/` + `prompts/DRUG_INFO_QA` | |
| Người dùng gõ sai tên thuốc | `domain/normalization.py` | Tên riêng tiếng Việt: khớp ký tự chính xác hơn embedding |

**Chỉ với thuốc–thuốc** mới cấm dùng similarity search để kết luận. Lý do cụ thể: truy
vấn *"Warfarin + Tamoxifen"* có thể trả về bản ghi *"Acenocoumarol + Tamoxifen"* — hai
thuốc cùng nhóm coumarin, rất gần nhau trong không gian embedding. Kết quả là một cảnh
báo **có nguồn, có trích dẫn nguyên văn, nhưng sai cặp thuốc** — lỗi vượt qua được mọi
lớp kiểm tra "có nguồn hay không".

---

## Đặt code vào đâu

| Việc | Chỗ |
|---|---|
| Endpoint mới | `api/v1/` — route MỎNG, chỉ validate + gọi domain/repo |
| Logic thuần (chuẩn hoá tên, severity, ghép cặp) | `domain/` |
| Truy vấn DB | `db/repositories/` |
| Prompt | `prompts/prompt_templates.py` |
| Gọi LLM | `llm/llm_client.py` |
| Node/tool của agent | `agents/` |
| Batch / chạy một lần | `ingestion/` |
| Tham số chỉnh được (chunk size, top_k, model) | `config.yaml`, không hard-code |
| Kiểu dữ liệu vào/ra API | `schemas/` |

---

## Quy ước

- Python 3.11 · ruff line-length 120 · **type hints bắt buộc** · **không bare `except:`**
- Pydantic v2 · import tuyệt đối `from medsafe.domain... import ...`
- Async cho mọi I/O trong đường request
- Commit message **tiếng Anh**, Conventional Commits

### Test

`tests/unit/domain/` phải chạy được **không cần LLM, không cần DB, không cần mạng**.
Đây là nơi đo *"tỷ lệ chuẩn hoá tên thuốc đúng"* — success metric trong PRD — và số liệu
đổ sang [`eval/results/report.md`](../eval/results/report.md).

Mock LLM qua fixture `mock_llm` trong `conftest.py`, không gọi OpenAI thật trong test.

---

## Dữ liệu

| Nguồn | Đặc điểm |
|---|---|
| [`dataset/drug_list_bv_gtvt.csv`](../dataset/) | ~1073 thuốc, **tên cột không dấu** (`Biet duoc`, `Hoat chat - Ham luong`, `Link HDSD 1`) |
| [`dataset/drugtodrug.json`](../dataset/) | cặp tương tác, **nội dung có dấu** (`Hoạt chất 1`, `Cơ chế`, `Hậu quả`, `Xử trí`) |

Một bên không dấu, một bên có dấu → mọi so khớp phải đi qua `domain/normalization.py`,
không so sánh chuỗi thô.

---

## Trạng thái

Khung thư mục và interface đã dựng; phần thân hàm phần lớn còn `NotImplementedError`.
Test tương ứng đã viết sẵn kèm `@pytest.mark.skip` có lý do, gỡ `skip` khi implement xong.
