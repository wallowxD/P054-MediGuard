# Kế hoạch triển khai: Luồng cốt lõi kiểm tra tương tác có dẫn nguồn

**Spec:** [spec.md](spec.md) · **Trạng thái:** Chờ leader duyệt trước code

## Tóm tắt

Pilot 50 thuốc dùng hai detection path: normalized exact-key lookup cho drug-drug và
thresholded semantic retrieval cho drug-food. Hai path hội tụ tại direct API response có
citation validation, deterministic severity, non-blocking review state, thin FastAPI route,
generated frontend type và React Query layering.

## Bối cảnh kỹ thuật

| Mục | Quyết định |
|---|---|
| Ngôn ngữ | Python 3.11 · Next.js 16/React 19/strict TypeScript |
| Backend | FastAPI, Pydantic v2, SQLAlchemy, LangGraph, rapidfuzz |
| OCR/Vector | Qwen OCR adapter · configured embeddings · Qdrant client |
| Storage | Supabase PostgreSQL + private Storage + Qdrant Cloud |
| API | Direct typed payload theo ADR 0011 |
| Test | pytest; frontend build/lint + quickstart trong feature này |
| Scale | Pilot 50 trước catalog khoảng 1.073 thuốc |
| Constraint | Tối đa 20 thuốc; domain test offline; citation bắt buộc; pending không chặn |

## Kiểm tra nguyên tắc

| Gate | Kết quả | Evidence |
|---|---|---|
| Citation hoặc không warning | PASS | FR-008–010, ADR 0006, contract |
| Đúng mechanism theo interaction type | PASS | Exact repository + scoped retriever, ADR 0012 |
| Không clinical conclusion | PASS | FR-017 |
| Review không chặn | PASS | FR-013/014, ADR 0005 |
| Domain deterministic/offline | PASS | FR-004/005/007, SC-006 |
| Một cửa cho side effect | PASS | repository, retriever, model adapter, React Query |
| Jira/spec/evidence có một owner | PASS | Jira giữ delivery; feature giữ intent/evidence |
| GATE | PASS | Không task nào target GATE; sửa GATE phải theo ADR 0019 |

## Quyết định thiết kế

1. Success trả Pydantic payload trực tiếp; error có status/type rõ.
2. Search trả candidate; chỉ stable ID user xác nhận mới vào check request.
3. Missing evidence nằm trong `unavailable`, tách khỏi evidenced item.
4. Qwen OCR endpoint/model đến từ config; quality được đánh giá bằng quote/coordinate thật.
5. Qdrant hit phải resolve `evidenceVersionId` trong PostgreSQL trước display.
6. Feature 001 chỉ đọc review state; OCR upload và pharmacist mutation có contract riêng.

## Hiện trạng code

| Khu vực | Hiện trạng | Cần làm |
|---|---|---|
| `domain/normalization.py` | Interface/stub | Implement deterministic matching + offline cases |
| `domain/pairing.py` | Có pairing cơ bản | Hoàn thiện limit/canonicalization/regression |
| `domain/severity.py` | Enum/rule chưa đủ | Deterministic classifier + tests |
| Pipeline RAG | Adapter/stub | Implement pilot ingestion/store/retrieval |
| models/repositories/schemas/routes | Scaffold | Thêm catalog, interaction, evidence và thin API |
| Frontend component | Có UI citation/severity/review | Nối generated contract |
| Frontend service/query | API-not-ready scaffold | Bật direct payload khi route sẵn sàng |

## Cấu trúc đích

```text
backend/src/medsafe/
├── domain/{normalization,pairing,severity}.py
├── db/models/{drug,interaction,evidence}.py
├── db/repositories/*_repository.py
├── schemas/{drugs,interactions,errors,extraction}.py
├── api/v1/{drugs,interactions}.py
├── agents/interaction_check.py
├── ingestion/  chunking/  embeddings/  vectordb/
└── retrieval/retriever.py

frontend/src/
├── constants/api.ts
├── services/interactions/index.ts
├── queries/interactions.ts
├── components/interactions/
├── store/reducers/drug-basket.ts
├── app/(protected)/interactions/page.tsx
└── lib/api/types.gen.ts    # chỉ được sinh tự động
```

## Các giai đoạn

### Giai đoạn 1 — Domain và schema offline

Viết failing tests cho normalization, limits, canonical pair, severity và wrong-pair
regression; implement pure domain; thêm Pydantic schema và exact-pair repository.

### Giai đoạn 2 — Pipeline bằng chứng

Chạy Qwen OCR adapter trên pilot; giữ verbatim text và coordinate; lưu raw artifact private,
authoritative evidence/pair trong PostgreSQL, vector/evidence pointer trong Qdrant; reconcile
mọi hit trước display.

### Giai đoạn 3 — API mỏng

Implement `GET /api/v1/drugs/search` và `POST /api/v1/interactions/check`; compose result ở
application/agent layer; sinh OpenAPI và TypeScript type.

### Giai đoạn 4 — Tích hợp frontend

Nối search, explicit selection, basket và check mutation qua React Query; validate citation,
pending/rejected, unavailable/partial, loading/error, responsive/dark mode/accessibility.

### Giai đoạn 5 — Kiểm chứng và bàn giao

Chạy quickstart + CI-equivalent checks; ghi normalization/extraction/citation/latency evidence;
đối chiếu thủ công code với FR/SC/tasks và cập nhật Jira trước completion.

## Đối chiếu contract và mô hình dữ liệu

| Spec concept | Data model | Contract |
|---|---|---|
| Xác nhận catalog | `DrugSearchResult`/`DrugCandidate` | `GET /api/v1/drugs/search` |
| Confirmed selection | `Drug.id[]` | `InteractionCheckRequest.drugIds` |
| Warning có evidence | `Interaction` + `Citation[]` | `InteractionItem` |
| Missing/invalid evidence | `UnavailableResult` | `unavailable[]` |
| Immutable source | `chunkId` + evidence version | required `chunkId` |
| Review visibility | pending/approved; filter rejected | response không có rejected |

## Ảnh hưởng tới ADR

ADR 0011: direct response · ADR 0012: exact-pair evidence · ADR 0013: Supabase/Qdrant/OCR
topology · ADR 0005/0006: review/citation. Model hoặc regional endpoint đổi qua config;
provider/ownership boundary đổi phải có ADR mới.
