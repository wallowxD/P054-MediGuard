# AGENTS.md — P-054 · Trợ lý An toàn Thuốc

> Ngữ cảnh dùng chung cho mọi công cụ AI làm việc trong repository: Claude Code, Codex,
> Cursor, Gemini CLI, GitHub Copilot và Antigravity. Đây là nguồn quy tắc duy nhất;
> `CLAUDE.md`, `.cursor/rules/` và `.github/copilot-instructions.md` đều trỏ về đây.

## ⚠️ Đọc trước khi làm bất kỳ việc gì

**Luôn mở workspace tại thư mục gốc `P-054/`.** Không mở riêng `backend/` hoặc
`frontend/`.

Các hook ghi log dùng đường dẫn tương đối từ root
(`bash scripts/_pyrun.sh scripts/log_hook.py ...`). Nếu mở sai thư mục, công cụ không tìm
thấy cấu hình hook, không ghi log và cũng không báo lỗi. Thành viên có thể làm việc nhiều
ngày nhưng không được ghi nhận AI log.

## Sản phẩm

**Trợ lý An toàn Thuốc** — agent tra cứu tương tác **thuốc–thuốc** và **thuốc–thực phẩm**
có dẫn nguồn, được tích hợp trong ứng dụng web “Health System X”.

Agent chỉ cung cấp **cảnh báo tham khảo** gồm trích dẫn nguyên văn, nguồn và trạng thái
duyệt. Agent không đưa ra kết luận lâm sàng và không thay thế đánh giá của bác sĩ.

Chi tiết sản phẩm: [gate/gate_1/README.md](gate/gate_1/README.md) và
[specs/product-vision.md](specs/product-vision.md).

### Ba nguyên tắc an toàn hiện hành

1. **Không bịa cảnh báo.** Mỗi cảnh báo phải có trích dẫn nguyên văn từ tờ hướng dẫn sử
   dụng gốc và đường dẫn nguồn. Không có trích dẫn thì trả về “chưa có dữ liệu”; model
   không được tự suy luận tương tác.
2. **Không kết luận lâm sàng.** Không chẩn đoán, kê đơn, đề xuất đổi thuốc hoặc đưa liều.
   Nguyên tắc này cấm hệ thống **tự nghĩ ra** một liều. Trích lại ngưỡng liều đã ghi trong
   tờ HDSD rồi đối chiếu với liều người dùng nhập thì được phép, theo ranh giới của
   [ADR 0018](adrs/0018-dose-comparison-boundary.md).
3. **Duyệt chuyên môn không chặn hiển thị.** Cảnh báo hợp lệ, kể cả mức nghiêm trọng, được
   hiển thị ngay với nhãn “đang chờ xác nhận chuyên môn”; dược sĩ duyệt song song.

Các nguyên tắc sản phẩm có thể được leader sửa thông qua spec và ADR được phê duyệt.
Riêng `gate/gate_1/` là bất biến và không thể được nới lỏng bởi bất kỳ tài liệu nào.

### Ngoài phạm vi — không tự ý bổ sung

Chẩn đoán hoặc kê đơn · AI tự đổi thuốc · bộ nhớ dài hạn của agent · sao chép giao diện
hoặc dữ liệu thật của bệnh viện tham chiếu.

**Thuốc–bệnh nền đã được đưa vào phạm vi** theo
[ADR 0017](adrs/0017-self-reported-health-profile.md), giới hạn ở bệnh nền **do người dùng
tự khai**. Agent không chẩn đoán, không suy luận bệnh và không tự thêm bệnh nền cho ai;
cảnh báo thuốc–bệnh nền vẫn phải có trích dẫn nguyên văn như mọi cảnh báo khác.

**Bộ nhớ dài hạn vẫn ngoài phạm vi.** Hồ sơ sức khoẻ tự khai không phải ngoại lệ của quy
tắc này: đó là dữ liệu người dùng chủ động nhập, nhìn thấy và xoá được, không phải thứ
agent tự ghi nhớ giữa các phiên.

## Đội ngũ

| Họ tên | Vai trò |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Developer |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend |

Đội: **Cuvée Tech** · Mã dự án: **P-054**

## Cấu trúc repository

Repository này là một **workspace dự án**, không chỉ là nơi chứa source code. Product
requirements, quyết định kiến trúc và hướng dẫn kỹ thuật đều được version control để con
người và AI đọc cùng một nguồn.

| Thư mục | Nội dung | Trả lời câu hỏi |
|---|---|---|
| [`specs/`](specs/) | Product baseline và workspace của từng tính năng | Xây dựng **cái gì**, **tại sao**, tiêu chí chấp nhận là gì |
| [`adrs/`](adrs/) | Architecture Decision Records | Xây dựng **như thế nào** và tại sao chọn cách đó |
| [`planning/`](planning/) | Con trỏ ngắn tới Jira `VMEC` | Delivery đang được theo dõi **ở đâu** |
| [`docs/`](docs/) | Hướng dẫn backend, frontend, agent và vận hành | Làm việc với code **như thế nào** |

`backend/` và `frontend/` chỉ chứa source code; tài liệu của chúng nằm trong `docs/`.

### Thứ tự đọc trước khi bắt đầu

1. [`specs/product-vision.md`](specs/product-vision.md) — mục tiêu và nguyên tắc an toàn.
2. [`specs/app-flow.md`](specs/app-flow.md) — luồng request, ingestion và review.
3. [`specs/domains.md`](specs/domains.md) — thuật ngữ và ranh giới RAG.
4. [`adrs/README.md`](adrs/README.md) — chỉ mục quyết định; nếu chạm luồng cảnh báo, đọc
   ADR 0012, 0005 và 0006.
5. [`planning/README.md`](planning/README.md) — mở ticket Jira để xem sprint, assignee,
   priority và status.
6. `spec.md`, `plan.md`, `tasks.md` của tính năng đang làm, nếu có.
7. [`docs/ai-development.md`](docs/ai-development.md) nếu dùng AI agent.
8. Trước khi code: [`docs/code-style.md`](docs/code-style.md), rồi
   [`docs/backend.md`](docs/backend.md) hoặc [`docs/frontend.md`](docs/frontend.md).

### Quy tắc cập nhật

- Thay đổi hành vi sản phẩm → cập nhật spec cùng pull request với code.
- Quyết định khó đảo ngược → tạo ADR mới; không viết lại lịch sử ADR cũ, mà đánh dấu
  `Bị thay thế bởi NNNN`.
- Jira là nơi duy nhất lưu ticket, sprint, assignee, priority và workflow status.
- `tasks.md` chỉ phân rã kỹ thuật có liên kết requirement; không được trở thành backlog thứ
  hai.
- Tài liệu sai lệch với code phải được sửa trong cùng PR.

### Bố cục chính

```text
P-054/
├── specs/              product baseline + workspace tính năng
├── adrs/               quyết định kiến trúc, đánh số tăng dần
├── planning/           chỉ có README trỏ tới Jira
├── docs/               hướng dẫn kỹ thuật và vận hành
├── gate/gate_1/        ★ ĐÃ NỘP — KHÔNG SỬA, XÓA, ĐỔI TÊN HOẶC DI CHUYỂN
├── backend/
│   ├── config.yaml     tham số cấu hình, không chứa secret
│   └── src/medsafe/
│       ├── ingestion/  loader.py · pipeline.py · cli.py — batch CSV/PDF/OCR
│       ├── chunking/   tách đoạn nhưng giữ nguyên văn
│       ├── embeddings/ bộ chuyển văn bản thành vector
│       ├── vectordb/   adapter Qdrant Cloud
│       ├── retrieval/  truy xuất đoạn dẫn nguồn
│       ├── prompts/    toàn bộ prompt, không viết inline
│       ├── llm/        cửa duy nhất gọi model/OCR provider
│       ├── api/        route mỏng
│       ├── domain/     logic thuần, không phụ thuộc framework/I/O
│       ├── db/         models + repositories
│       ├── agents/     workflow LangGraph
│       └── schemas/    Pydantic I/O, sinh OpenAPI
├── backend/tests/      unit/domain · unit/agents · unit/retrieval · integration/api
├── frontend/src/      Next.js App Router + TypeScript + Tailwind + shadcn/ui
├── dataset/           dữ liệu danh mục được phép version control
├── eval/              kết quả đánh giá
├── presentation/  scripts/  .ai-log/
└── .env  .venv/       phải nằm ở root
```

## ★ Ranh giới RAG quan trọng nhất

| Câu hỏi | Cơ chế | Lý do |
|---|---|---|
| Thuốc–thuốc có tương tác không, mức độ nào? | `db/repositories/` + `domain/` — **tra cứu exact key** | Bản ghi cặp chuẩn là nguồn sự thật; similarity có thể trả nhầm cặp gần nghĩa |
| Thuốc–thực phẩm có tương tác không? | `retrieval/` — semantic search theo leaflet đã chọn | Không có bảng quan hệ có cấu trúc cho thực phẩm |
| Thuốc–bệnh nền có tương tác không? | `db/repositories/` + `domain/` — **tra cứu exact key** | Cùng lý do với thuốc–thuốc: bản ghi của một bệnh gần nghĩa có nguồn thật nhưng sai cặp |
| Trích dẫn nguyên văn | `retrieval/` rồi resolve evidence trong PostgreSQL | Mọi nội dung hiển thị phải truy vết được |
| Hỏi đáp thông tin thuốc | `retrieval/` + prompt chuyên biệt | Chỉ trả lời dựa trên nguồn |
| Người dùng gõ sai tên thuốc | `domain/normalization.py` | Fuzzy matching ký tự phù hợp tên riêng tiếng Việt hơn embedding |

Chỉ với thuốc–thuốc, similarity search bị cấm dùng làm cơ sở kết luận. Ví dụ truy vấn
“Warfarin + Tamoxifen” có thể trả bản ghi “Acenocoumarol + Tamoxifen”: nguồn và trích dẫn
đều thật nhưng sai cặp thuốc. Với thuốc–thực phẩm, semantic retrieval là cơ chế phát hiện,
nhưng kết quả vẫn phải là đoạn nguyên văn.

Dưới `retrieval.score_threshold` → trả rỗng → tầng trên báo “chưa có dữ liệu”. Không hạ
threshold chỉ để ép hệ thống trả kết quả.

## Vị trí code theo trách nhiệm

| Trách nhiệm | Vị trí |
|---|---|
| Endpoint mới | `api/v1/` |
| Logic thuần: chuẩn hóa, severity, pairing | `domain/` |
| Database query | `db/repositories/`, không query trong route |
| Prompt | `prompts/prompt_templates.py`, không viết inline |
| Gọi model/OCR provider | `llm/llm_client.py`, không gọi SDK ở nơi khác |
| Node và tool của agent | `agents/` |
| Batch hoặc job một lần | `ingestion/` |
| Tham số có thể tinh chỉnh | `backend/config.yaml`, không hardcode |
| Request/response API | `schemas/` |

## Quy ước lập trình

### Python

- Python 3.11 · ruff line-length 120 · select `E,F,I,N,W,UP`.
- Mọi public function bắt buộc có type hints.
- Không dùng bare `except:`; bắt exception cụ thể hoặc dùng handler trung tâm.
- Pydantic v2; absolute import `from medsafe...`.
- Mọi I/O trên request path dùng async.

### Frontend

- Strict TypeScript · App Router · Tailwind · shadcn/ui.
- `src/lib/api/types.gen.ts` được sinh từ OpenAPI; không sửa bằng tay.
- Component không gọi `services/*` trực tiếp; luôn đi qua React Query hook trong
  `queries/*`.
- Dark mode, responsive và accessibility là tiêu chí bắt buộc.

### Tài liệu

- Markdown do team sở hữu được viết bằng **tiếng Việt chuyên ngành**, giữ nguyên identifier,
  tên thư viện, field, endpoint và lệnh bằng tiếng Anh.
- Ngoại lệ: `gate/` đã nộp và `docs/guide/` là tài liệu chương trình — không dịch hoặc sửa.
- Không đặt file `.md` trong `backend/` hoặc `frontend/`; tài liệu đặt trong `docs/`.

### Git

- Commit message viết bằng tiếng Anh theo Conventional Commits: `feat:`, `fix:`, `docs:`,
  `refactor:`, `chore:`.
- Không commit `.env` hoặc `frontend/.env.local`.
- Không dùng `git push --no-verify`.
- Branch dùng đúng Jira key, ví dụ `VMEC-42`.

### Kiểm thử

- `backend/tests/unit/domain/` chạy không cần LLM, database hoặc network.
- Mock mọi model/OCR provider trong test; không gọi dịch vụ thật.
- Không tuyên bố “test pass” nếu toàn bộ test bị skip.

## Ghi log sử dụng AI — tự động, không can thiệp

Không được:

- tự chạy `scripts/log_hook.py`, `scripts/log_antigravity.py` hoặc `scripts/submit_log.py`;
- sửa hoặc xóa `.ai-log/`;
- thay đổi file dưới `scripts/`;
- bỏ qua hook bằng `git push --no-verify`.

Nếu pre-push hook lỗi, báo leader; không bypass. Chi tiết:
[.agents/rules/ai-log-hook.md](.agents/rules/ai-log-hook.md) và
[AI_LOGGING_SETUP.md](AI_LOGGING_SETUP.md).

## Sản phẩm bàn giao được chấm điểm

| File | Nhịp cập nhật |
|---|---|
| [WORKLOG.md](WORKLOG.md) | Hằng ngày |
| [JOURNAL.md](JOURNAL.md) | Hằng tuần |
| [docs/architecture_diagram.md](docs/architecture_diagram.md) | Khi kiến trúc thay đổi |
| [eval/results/report.md](eval/results/report.md) | Khi có phép đo mới |
| [README.md](README.md) | Khi setup, luồng làm việc hoặc kiến trúc thay đổi |

Checklist đầy đủ: [docs/guide/deliverables/checklist.md](docs/guide/deliverables/checklist.md).

**`gate/gate_1/` đã được nộp — tuyệt đối không sửa, xóa, đổi tên hoặc di chuyển.**
