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
│   ├── oauth/google_client.py # cửa duy nhất verify Google ID Token (ADR 0016)
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
| Gọi identity provider (Google OIDC) | `oauth/google_client.py`; không import `google-auth` nơi khác |
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
  phải catalog match và user xác nhận stable ID. Ảnh đơn do patient tải lên được re-encode
  trong RAM để bỏ metadata rồi huỷ sau request; không lưu ảnh, filename hoặc model output.
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

## Auth và migration

Auth do backend tự sở hữu, không dùng Supabase Auth — xem
[ADR 0015](../adrs/0015-backend-owned-identity.md). Năm endpoint đã chạy:
`POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/google`
(đăng nhập Google OpenID Connect, xem [ADR 0016](../adrs/0016-google-oidc-login.md)),
`POST /api/v1/auth/refresh`, `GET /api/v1/auth/profiles`. Hình dạng request/response ở
[specs/api-contracts.md](../specs/api-contracts.md).

| Trách nhiệm | Vị trí |
|---|---|
| Hash mật khẩu, chính sách mật khẩu, ký/giải mã JWT, claim Google | `domain/auth.py` — thuần, test offline |
| Verify Google ID Token (gọi mạng) | `oauth/google_client.py` |
| Truy vấn bảng `users` | `db/repositories/user_repository.py` |
| Truy vấn bảng `oauth_identities` | `db/repositories/oauth_identity_repository.py` |
| Engine + session async | `db/session.py` |
| Dependency `get_current_user`, `get_user_repository`, `get_oauth_identity_repository` | `api/dependencies.py` |
| Map exception domain → HTTP status | `api/errors.py` |
| TTL token, độ dài mật khẩu tối thiểu, role mặc định | `backend/config.yaml`, section `auth` |
| `JWT_SECRET_KEY`, `GOOGLE_OAUTH_CLIENT_ID` | `.env` tại repo root |

Endpoint cần đăng nhập thì thêm `current_user: CurrentUserDep` vào signature. Frontend
guard chỉ phục vụ UX; backend mới là security boundary (ADR 0007).

User chỉ đăng nhập Google có `password_hash IS NULL` (migration 0003) — `/auth/login` coi
đây là "email không tồn tại" thay vì lộ chi tiết tài khoản gắn provider nào.

## Bảng dữ liệu và ORM model

| Bảng | Model | Vai trò |
|---|---|---|
| `users` | `db/models/user.py` | Tài khoản đăng nhập, do Alembic tạo (revision 0001); `password_hash` nullable từ 0003 |
| `oauth_identities` | `db/models/oauth_identity.py` | Liên kết `users` ↔ danh tính OAuth provider, do Alembic tạo (revision 0003) |
| `drugs` | `db/models/drug.py` | Danh mục thuốc đã ingest |
| `drug_drug_interactions` | `db/models/interaction.py` | ★ Nguồn sự thật exact-pair cho thuốc–thuốc |
| `drug_food_interactions` | `db/models/interaction.py` | Tương tác thuốc–thực phẩm đã xác nhận |
| `evidence_chunks` | `db/models/evidence.py` | Đoạn nguyên văn từ tờ HDSD, đích resolve của Qdrant |

Bốn bảng cuối được tạo tay bằng Supabase SQL Editor trước khi project dùng Alembic.
Revision 0002 ghi lại đúng schema đó và được `stamp` lên database đang chạy nên dữ liệu
không bị đụng tới; môi trường dựng mới thì `make migrate` sẽ tạo đủ.

**Model phải luôn khớp schema thật.** Cách kiểm tra: chạy `make migration m="check"`, nếu
file sinh ra có `upgrade()` rỗng thì khớp; xoá file đó đi. Có op nào xuất hiện nghĩa là
model và database đã lệch.

### Lệch đã biết giữa schema và spec — chưa có quyết định

Ba điểm dưới đây là lệch thật giữa database hiện tại và
`specs/001-core-interaction-check/data-model.md`. Không tự ý sửa; cần Jira decision ticket.

1. **`review_status` dùng `pending_review`, spec dùng `pending`.** Endpoint nào trả review
   status ra ngoài phải map ở tầng schema. Đừng UPDATE dữ liệu trong bảng cho khớp spec.
2. **`drug_food_interactions` thiếu `reviewer_id`/`reviewed_at`** trong khi
   `drug_drug_interactions` có đủ. Dược sĩ duyệt cảnh báo thuốc–thực phẩm hiện không ghi
   lại được ai duyệt và duyệt lúc nào.
3. **`evidence_chunks` thiếu `page`**, trong khi `Citation` quy định `page` là số dương
   hoặc null. Hiện chỉ có `start_char`/`end_char`.

### Migration

```bash
make migrate                       # alembic upgrade head
make migration m="add drug table"  # sinh revision mới (autogenerate)
make migrate-down                  # lùi một revision
```

⚠️ `make migrate-down` lùi quá revision 0002 sẽ **xoá toàn bộ danh mục thuốc, dữ liệu
tương tác và evidence chunk** trên Supabase. Chỉ downgrade tới 0002 hoặc thấp hơn trên
database dựng mới.

Hai điểm bắt buộc nhớ:

1. **Model mới phải được import trong `db/models/__init__.py`.** Alembic autogenerate chỉ
   thấy những gì đã nằm trong `Base.metadata`.
2. **`migrations/env.py` có `include_object` chặn autogenerate xoá bảng chưa model hoá.**
   Bảng ở project này hay được tạo tay bằng Supabase SQL Editor trước khi có ORM model;
   không có guard đó, một revision autogenerate sẽ sinh `op.drop_table(...)` cho chúng.
   Hệ quả: muốn xoá bảng thật thì phải viết `op.drop_table(...)` bằng tay.

### Ràng buộc Row Level Security

PostgREST của Supabase expose mọi bảng schema `public` qua anon key, mà anon key nằm công
khai trong bundle frontend. Mọi bảng chứa dữ liệu không công khai — `users` là ví dụ rõ
nhất vì có `password_hash` — phải `ENABLE ROW LEVEL SECURITY` trong migration và không tạo
policy. Backend kết nối bằng role sở hữu bảng nên bỏ qua RLS và vẫn hoạt động.

### Kết nối Supabase

`DATABASE_URL` dùng **session pooler (cổng 5432)**, không dùng transaction pooler (6543):
transaction pooler ghép nhiều client vào chung connection nên prepared statement của
psycopg biến mất giữa chừng, lỗi chỉ hiện ra khi có tải. Ký tự đặc biệt trong mật khẩu
phải percent-encode (`@` → `%40`).

## Trạng thái hiện tại

Backend expose `/health`, `/api/v1/status` và nhóm `/api/v1/auth/*`. Business router
(interactions, drugs, prescriptions, reviews) vẫn chưa được bật.

Chưa có quyết định cuối cho: xác thực email, quên mật khẩu, thu hồi refresh token,
production logging/observability và backend deployment provider. Không tự đặt convention;
tạo/link Jira ticket và ghi ADR khi team duyệt.
