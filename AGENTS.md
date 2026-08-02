# AGENTS.md — P-054 · Medication Safety Copilot

> Ngữ cảnh dùng chung cho **mọi AI tool** làm việc trên repo này: Claude Code, Codex,
> Cursor, Gemini CLI, GitHub Copilot, Antigravity.
> Đây là **nguồn sự thật duy nhất**. `CLAUDE.md`, `.cursor/rules/`,
> `.github/copilot-instructions.md` đều chỉ trỏ về file này.

---

## ⚠️ Đọc trước khi làm bất cứ việc gì

**LUÔN mở repo ở thư mục gốc `P-054/`.** Không mở thẳng `backend/` hay `frontend/`
làm workspace.

Toàn bộ hook logging dùng **đường dẫn tương đối từ repo root**
(`bash scripts/_pyrun.sh scripts/log_hook.py ...`). Mở ở thư mục con thì tool
không tìm thấy `.claude/` / `.cursor/` → **không hook nào chạy → không log gì cả,
và không báo lỗi**. Người đó push cả tuần mà điểm AI log bằng 0.

---

## Sản phẩm

**Medication Safety Copilot** — AI Agent tra cứu tương tác **thuốc–thuốc** và
**thuốc–thực phẩm** *có nguồn*, đặt trong bối cảnh web app "Hệ thống y tế X".

Agent đóng vai trò **cảnh báo an toàn tham khảo**: hiển thị nguyên văn trích dẫn
kèm nguồn và trạng thái review. **Không tự kết luận lâm sàng, không thay thế
quyết định của bác sĩ.**

Chi tiết đầy đủ: [gate/gate_1/README.md](gate/gate_1/README.md) (Brief + PRD + UI Flow).

### Ba luật bất di bất dịch

1. **Không bịa cảnh báo.** Mỗi cảnh báo **bắt buộc** gắn với đoạn trích nguyên văn
   từ PDF HDSD gốc + link nguồn. Không có trích dẫn thì không có cảnh báo —
   trả về "chưa có dữ liệu", không được để LLM tự suy luận ra tương tác.
2. **Không kết luận lâm sàng.** Không sinh chẩn đoán, không đề xuất đổi thuốc,
   không đưa liều. Mọi output là thông tin tham khảo.
3. **Human-in-the-loop không chặn luồng.** Mọi cảnh báo (kể cả severe/major) hiển
   thị **ngay** cho bệnh nhân, kèm nhãn *"chờ xác nhận chuyên môn"*. Dược sĩ duyệt
   song song. **Không** implement mô hình full-gate chặn cảnh báo chờ duyệt.

### Ngoài phạm vi (đừng tự ý thêm)

Chẩn đoán/kê đơn · AI tự đổi thuốc · tương tác thuốc–bệnh lý · memory dài hạn ·
clone UI hoặc dữ liệu thật của bệnh viện tham khảo.

---

## Team

| Họ tên | Vai trò |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Dev |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend |

Team: **Cuvée Tech** · Mã dự án: **P-054**

---

## Cấu trúc repo

### Trạng thái hiện tại — ĐANG DI TRÚ

Repo đang chuyển từ layout template (Python ở root) sang monorepo. Trong giai đoạn
này **cả hai chỗ cùng tồn tại**:

| Đường dẫn | Trạng thái |
|---|---|
| `src/`, `tests/`, `requirements.txt` ở root | **LEGACY** — code template, sẽ bị move |
| `backend/`, `frontend/` | **ĐÍCH** — đang được init |

**Code mới viết vào đâu:** hỏi user trước nếu chưa rõ PR restructure đã merge chưa.
Sau khi merge, mọi thứ Python nằm dưới `backend/src/medsafe/`.

Kế hoạch di trú chi tiết: [docs/restructure-plan.md](docs/restructure-plan.md).

### Layout đích

Backend theo **layout RAG pipeline** — mỗi bước một thư mục:

```
P-054/
├── gate/gate_1/        ★ ĐÃ SUBMIT — TUYỆT ĐỐI KHÔNG SỬA/XOÁ/ĐỔI TÊN
├── backend/
│   ├── config.yaml     tham số RAG (chunk size, top_k, model) — KHÔNG chứa secret
│   ├── logs/           log file (đã gitignore)
│   └── src/medsafe/
│       ├── ingestion/    loader.py · pipeline.py · cli.py — nạp CSV/JSON/PDF, batch
│       ├── chunking/     chunker.py — cắt tờ HDSD, GIỮ NGUYÊN VĂN
│       ├── embeddings/   embedder.py
│       ├── vectordb/     vector_store.py — ChromaDB
│       ├── retrieval/    retriever.py
│       ├── prompts/      prompt_templates.py — mọi prompt ở đây, không rải trong code
│       ├── llm/          llm_client.py — MỘT cửa duy nhất gọi model
│       ├── api/          routes.py + v1/ — route MỎNG
│       ├── utils/        helpers.py
│       ├── domain/       ★ logic THUẦN — không import fastapi/sqlalchemy/openai
│       ├── db/           models/ + repositories/
│       ├── agents/       LangGraph
│       └── schemas/      Pydantic I/O → nguồn sinh openapi.json
├── backend/tests/      unit/domain · unit/agents · unit/retrieval · integration/api
├── frontend/src/       Next.js App Router + TS + Tailwind + shadcn
├── dataset/            ★ GIỮ NGUYÊN TÊN (.gitignore đang ignore `data/`)
├── eval/               deliverable #10
├── docs/  presentation/  scripts/  .ai-log/
└── .env  .venv/        ★ BẮT BUỘC ở root
```

### ★ Ranh giới RAG quan trọng nhất

Vai trò của similarity search **khác nhau tuỳ loại tương tác**. Đừng áp một luật chung.

| Câu hỏi | Cơ chế | Vì sao |
|---|---|---|
| Thuốc–thuốc: có tương tác không? Mức nào? | `db/repositories/` + `domain/` — **tra bảng** | `drugtodrug.json` là quan hệ (A,B)→bản ghi. Tra khoá chính xác 100% theo định nghĩa |
| **Thuốc–thực phẩm: có tương tác không?** | **`retrieval/`** — tìm kiếm ngữ nghĩa | Không tồn tại bảng tra; thông tin nằm trong văn bản tự do của HDSD |
| Đoạn trích nguyên văn minh chứng | `retrieval/` | |
| Tra thông tin thuốc (Q&A) | `retrieval/` + `prompts/DRUG_INFO_QA` | |
| Người dùng gõ sai tên thuốc | `domain/normalization.py` (khớp mờ) | Tên riêng tiếng Việt: rapidfuzz + bỏ dấu chính xác hơn embedding |

**Chỉ với thuốc–thuốc** mới cấm dùng similarity search để kết luận. Lý do cụ thể: truy
vấn *"Warfarin + Tamoxifen"* có thể trả về bản ghi *"Acenocoumarol + Tamoxifen"* (cùng
nhóm coumarin, rất gần nhau trong không gian embedding) → cảnh báo **có nguồn, có trích
dẫn, nhưng sai cặp thuốc**. Lỗi này vượt qua được mọi lớp kiểm tra "có nguồn hay không".

Với thuốc–thực phẩm thì ngược lại: retrieval **chính là** cơ chế phát hiện, vì không có
bảng nào để tra. Ràng buộc là đầu ra phải là đoạn trích nguyên văn, không phải kết luận
model tự phát biểu.

Dưới `retrieval.score_threshold` → trả rỗng → tầng trên báo **"chưa có dữ liệu"**.
Không hạ ngưỡng để "có gì đó mà trả về".

### Đặt code vào đâu

| Việc | Chỗ |
|---|---|
| Endpoint mới | `api/v1/` |
| Logic thuần (chuẩn hoá tên, xếp severity, ghép cặp) | `domain/` |
| Truy vấn DB | `db/repositories/` — **không** viết query trong route |
| Prompt | `prompts/prompt_templates.py` — không viết prompt inline trong node |
| Gọi LLM | `llm/llm_client.py` — không gọi thẳng SDK OpenAI ở nơi khác |
| Node/tool của agent | `agents/` |
| Batch / chạy một lần | `ingestion/` |
| Tham số chỉnh được (chunk size, top_k, model) | `backend/config.yaml`, không hard-code |
| Kiểu dữ liệu vào/ra API | `schemas/` |

---

## Dữ liệu

- `dataset/drug_list_bv_gtvt.csv` — danh mục thuốc BV GTVT, ~1073 dòng, **tiếng Việt
  không dấu ở tên cột**. Cột quan trọng: `Biet duoc`, `Hoat chat - Ham luong`,
  `Link HDSD 1`.
- `dataset/drugtodrug.json` — cặp tương tác đã có: `Hoạt chất 1`, `Hoạt chất 2`,
  `Cơ chế`, `Hậu quả`, `Xử trí` (tiếng Việt **có dấu**).

Lưu ý: tên cột CSV **không dấu**, nội dung JSON **có dấu** — mọi so khớp phải đi qua
`domain/normalization.py`, không so sánh chuỗi thô.

Không commit dữ liệu lớn. `data/` đã bị gitignore; `dataset/` thì không — đừng đổi
tên `dataset/` thành `data/`, sẽ mất dữ liệu khỏi git.

---

## Quy ước code

### Python
- Python 3.11 · ruff line-length **120** · select `E,F,I,N,W,UP`
- **Type hints bắt buộc** trên mọi hàm public (tiêu chí chấm Code Quality)
- **Không bare `except:`** — bắt exception cụ thể, hoặc dùng handler tập trung ở
  `api/errors.py`
- Pydantic v2 (`model_config = SettingsConfigDict(...)`, không dùng `class Config`)
- Import tuyệt đối: `from medsafe.domain.severity import ...`
- Async cho mọi I/O trong đường request

### Frontend
- TypeScript strict · App Router · Tailwind · shadcn/ui
- **`src/lib/api/types.gen.ts` là file SINH** từ `openapi.json` — không sửa tay
- Dark mode + responsive là **tiêu chí chấm điểm**, không phải nice-to-have

### Git
- **Commit message viết bằng tiếng Anh**, theo Conventional Commits
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`) — kể cả khi trao đổi tiếng Việt.
- Không commit `.env`. Không `git push --no-verify` (sẽ bỏ qua submit AI log).

### Test
- `backend/tests/unit/domain/` phải chạy được **không cần LLM, không cần DB, không
  cần mạng**. Đây là chỗ đo "tỷ lệ chuẩn hoá tên thuốc đúng" cho `eval/`.
- Mock LLM qua fixture `mock_llm` trong `conftest.py`, không gọi OpenAI thật trong test.

---

## AI Usage Logging — TỰ ĐỘNG, đừng đụng vào

Logging đã tự động hoá hoàn toàn qua hook + pre-push.

**KHÔNG được:**
- ❌ Gọi tay `scripts/log_hook.py`, `scripts/log_antigravity.py`, `scripts/submit_log.py`
- ❌ Sửa/xoá file trong `.ai-log/`
- ❌ Sửa bất cứ gì trong `scripts/`
- ❌ Bypass hook bằng `git push --no-verify`

Nếu pre-push báo lỗi → **báo lại cho user**, không tự ý bypass.
Chi tiết: [.agents/rules/ai-log-hook.md](.agents/rules/ai-log-hook.md) ·
[AI_LOGGING_SETUP.md](AI_LOGGING_SETUP.md)

Dùng tool web không có hook (ChatGPT, Claude.ai, Gemini Web) → log tay theo
[.agents/workflows/log.md](.agents/workflows/log.md).

---

## Deliverable đang được chấm

Đừng để các file này mốc — chúng có điểm:

| File | Nhịp cập nhật |
|---|---|
| [WORKLOG.md](WORKLOG.md) | **hàng ngày** — dùng `/worklog` |
| [JOURNAL.md](JOURNAL.md) | **hàng tuần** — dùng `/journal` |
| [docs/architecture_diagram.md](docs/architecture_diagram.md) | khi kiến trúc đổi |
| [eval/results/report.md](eval/results/report.md) | khi có số đo mới |
| [README.md](README.md) | Problem → Solution → Tech Stack → Setup → Team |

Checklist đầy đủ: [docs/guide/deliverables/checklist.md](docs/guide/deliverables/checklist.md)

**`gate/gate_1/` đã submit — không sửa, không xoá, không đổi tên, không di chuyển.**
