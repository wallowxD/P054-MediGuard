# 💊 Trợ lý An toàn Thuốc — Cuvée Tech (P-054)

> Người bệnh đang phải tự tra từng thuốc và đối chiếu từng cặp → hệ thống hỗ trợ tra cứu
> tương tác thuốc–thuốc và thuốc–thực phẩm, luôn kèm trích dẫn nguồn, được tích hợp trong
> ứng dụng web “Health System X”.

Hệ thống chỉ cung cấp **thông tin cảnh báo tham khảo** gồm trích dẫn nguyên văn, nguồn và
trạng thái duyệt. Hệ thống không đưa ra kết luận lâm sàng và không thay thế bác sĩ.

## Bài toán

Danh mục thuốc của bệnh viện chưa gắn dữ liệu tương tác. Người dùng phải mở từng tờ hướng
dẫn sử dụng PDF và tự kiểm tra mọi cặp thuốc — chậm, dễ bỏ sót và khó đánh giá với người
không có chuyên môn. Nhiều công cụ hiện có dùng tiếng Anh, không khớp biệt dược tại Việt
Nam hoặc đưa kết luận mà không hiển thị nguồn.

## Giải pháp

- **Tra cứu thuốc–thuốc:** tạo mọi cặp từ danh sách đã xác nhận và tra exact key trong dữ
  liệu có bằng chứng.
- **Tra cứu thuốc–thực phẩm:** semantic retrieval trên nội dung leaflet và trả đoạn nguyên
  văn.
- **Severity và nguồn:** mỗi cảnh báo có mức độ, trích dẫn và link PDF gốc.
- **Human-in-the-loop không chặn luồng:** cảnh báo hợp lệ hiển thị ngay với nhãn “đang chờ
  xác nhận chuyên môn”; dược sĩ duyệt song song.

### Ba nguyên tắc an toàn hiện hành

1. Không bịa cảnh báo — không citation thì trả “chưa có dữ liệu”.
2. Không chẩn đoán, đổi thuốc, kê đơn hoặc đưa liều.
3. Không chờ duyệt chuyên môn mới hiển thị cảnh báo hợp lệ.

## Công nghệ

| Tầng | Công nghệ |
|---|---|
| AI workflow | LangGraph xác định trước + LangChain tools |
| OCR | Gemini cho đơn thuốc đầu vào · Qwen OCR cho leaflet theo batch |
| RAG | Qdrant Cloud + embeddings được cấu hình · pypdf |
| Backend | FastAPI + Uvicorn · Python 3.11+ |
| Chuẩn hóa tên thuốc | rapidfuzz + unidecode |
| Frontend | Next.js 16 App Router + React 19 + strict TypeScript |
| Giao diện | Tailwind CSS v4 + shadcn/ui |
| Dữ liệu | Supabase PostgreSQL + private Storage · PostgreSQL local cho development |
| Triển khai | Dự kiến một VPS; production topology chờ ADR được phê duyệt |
| Tooling | uv · Yarn 4 · ruff · pytest |
| DevOps | Docker Compose + GitHub Actions |

## 🚀 Thiết lập môi trường

### Đọc trước

**Luôn mở repository tại root `P-054/`.** Không mở riêng `backend/` hoặc `frontend/` làm
workspace vì hook ghi AI log dùng đường dẫn tương đối từ root.

### Yêu cầu

| Công cụ | Phiên bản | Kiểm tra |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| uv | bản mới ổn định | `uv --version` |
| Node.js | 20+ (team dùng 24) | `node -v` |
| Corepack | đi kèm Node | `corepack enable` |
| Docker Desktop | tùy chọn | dùng khi chạy stack container |

Repository ghim `yarn@4.18.0` trong `frontend/package.json`. Không cài Yarn bằng
`npm i -g yarn`, không dùng `npm install` và không dùng `npx next dev`.

### Bước 1 — Clone và cấu hình Git

```bash
git clone https://github.com/AI20K-Build-Phase-Cohort-3/P-054.git
cd P-054
git config user.email "email-da-dang-ky-voi-chuong-trinh@gmail.com"
corepack enable
```

### Bước 2 — Tạo file môi trường local

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
openssl rand -base64 32
```

Điền secret vừa sinh vào `NEXTAUTH_SECRET` trong `frontend/.env.local`; nếu dùng Docker
Compose, điền thêm vào `.env` tại root. Chỉ cấu hình credential cần cho phần việc đang làm.
Mỗi thành viên dùng `AI_LOG_API_KEY` cá nhân.

Nếu làm việc với backend auth, cần thêm hai biến trong `.env`:

```bash
openssl rand -hex 32   # dán vào JWT_SECRET_KEY
```

`DATABASE_URL` lấy từ Supabase → Project Settings → Database → Connection string, chọn
**Session pooler (cổng 5432)**, đổi tiền tố `postgresql://` thành `postgresql+psycopg://`
và percent-encode ký tự đặc biệt trong mật khẩu (`@` → `%40`). Sau đó chạy `make migrate`.

- Secret backend: `.env` tại root.
- Biến local của Next.js: `frontend/.env.local`.
- Không commit hai file này.
- `backend/.env.example` chỉ là tài liệu tên biến.

### Bước 3 — Cài hook ghi AI log

```bash
bash scripts/setup_hooks.sh
```

Chỉ chạy một lần trên mỗi clone. Không sửa script, không tự chạy script log và không dùng
`git push --no-verify`.

### Bước 4 — Cài thư viện phụ thuộc

```bash
make install
make web-install
```

### Bước 5 — Chạy ứng dụng

```bash
make dev
```

Hoặc chạy riêng trong hai terminal:

```bash
make run   # FastAPI: http://localhost:8000
make web   # Next.js: http://localhost:3000
```

### Bước 6 — Kiểm tra

| URL | Kết quả mong đợi |
|---|---|
| http://localhost:3000 | Landing page |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/health | `{"status": "ok", "env": "development"}` |

## Lệnh thường dùng

| Lệnh | Mục đích |
|---|---|
| `make install` | `uv sync`, tạo `.venv` tại root |
| `make run` | Chạy backend tại cổng 8000 |
| `make test` | Chạy backend tests |
| `make lint` / `make format` | Kiểm tra/sửa format Python |
| `make check` | Ruff + format check + pytest, tương đương backend CI |
| `make ingest-pilot` | Chạy ingestion cho pilot 50 thuốc |
| `make migrate` | Áp schema lên `DATABASE_URL` (Alembic) |
| `make migration m="..."` | Sinh revision Alembic mới |
| `make web-install` | Cài dependency frontend bằng Yarn |
| `make web` | Chạy frontend tại cổng 3000 |
| `make web-lint` / `make web-build` | ESLint / production build |
| `make dev` | Chạy frontend và backend song song |
| `make up` / `make down` | Khởi động/dừng Docker Compose local |

## 📁 Cấu trúc không gian làm việc

```text
P-054/
├── README.md           điểm bắt đầu cho thành viên
├── AGENTS.md           quy tắc chung cho con người và AI
├── specs/              product baseline + workspace tính năng
├── adrs/               quyết định kiến trúc và lý do
├── planning/           README trỏ tới Jira VMEC
├── docs/               hướng dẫn code, workflow, agent và vận hành
├── backend/            FastAPI + LangGraph + adapter Qdrant
├── frontend/           Next.js App Router + TypeScript + Tailwind
├── dataset/            danh mục thuốc bệnh viện
├── gate/gate_1/        ★ ĐÃ NỘP — không sửa, xóa, đổi tên hoặc di chuyển
├── eval/  presentation/  scripts/
├── WORKLOG.md  JOURNAL.md
└── .env  .venv/        phải nằm tại root
```

## Thành viên mới đọc gì?

Đọc theo thứ tự:

1. [Tầm nhìn sản phẩm](specs/product-vision.md).
2. [Luồng toàn ứng dụng](specs/app-flow.md).
3. [Mô hình miền và ranh giới RAG](specs/domains.md).
4. [Workflow Jira + spec](docs/workflow.md).
5. [Hướng dẫn phát triển với AI agent](docs/ai-development.md).
6. [Con trỏ tới Jira VMEC](planning/README.md).
7. [Chỉ mục ADR](adrs/README.md).
8. [Quy tắc repository](AGENTS.md).

Trước khi code:

| Phạm vi | Tài liệu bắt buộc |
|---|---|
| Mọi thay đổi | [Quy ước code](docs/code-style.md) |
| Backend | [Hướng dẫn backend](docs/backend.md) |
| Frontend | [Hướng dẫn frontend](docs/frontend.md) |
| Luồng cảnh báo | ADR 0012, 0005 và 0006 |

## Quy trình từ Jira tới pull request

```text
Jira VMEC-NN
→ leader duyệt spec/plan/contract/tasks
→ branch VMEC-NN
→ implement theo task có traceability
→ test + quickstart + cập nhật tài liệu/evidence
→ PR link Jira và spec
→ CI + review
→ merge và cập nhật Jira
```

Tạo branch:

```bash
git checkout main
git pull --ff-only
git checkout -b VMEC-NN
```

Trước khi code, đọc `spec.md`, `plan.md`, `tasks.md`, contract, checklist và ADR liên quan.
Nếu acceptance criterion hoặc kiến trúc chưa rõ, hỏi leader; không để AI hoặc developer tự
chọn assumption.

| Khu vực | Quy tắc tầng | Lệnh phát triển |
|---|---|---|
| Backend | route mỏng → agent/domain → repository/retriever | `make run`, `make test`, `make check` |
| Frontend | component → React Query hook → service → backend | `make web`, `make web-lint`, `make web-build` |
| Cả hai | Giữ contract đã duyệt; sinh type từ OpenAPI | `make dev` |

Business backend vẫn đang được implement. Các service frontend gọi `apiNotReady()` chỉ
được bật khi route FastAPI và contract tương ứng đã tồn tại; không tự tạo response shape
tạm trong component.

Trước mỗi pull request:

```bash
make check
make web-lint
make web-build
git diff --check
git status --short
```

Commit bằng tiếng Anh theo Conventional Commits. PR phải link Jira issue và spec, nêu rõ
kết quả kiểm thử, đồng thời pass toàn bộ GitHub checks. Không commit secret, sửa GATE,
`.ai-log/`, generated API types hoặc logging scripts.

## Các lỗi thường gặp

### `next: command not found`

Chạy lại `make web-install`. Không dùng `npx next dev`.

### Port vẫn bận sau `Ctrl-C`

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Xác định đúng PID của process development rồi mới dừng; không dùng pattern kill rộng trên
máy dùng chung.

### Pre-push hook lỗi

Báo leader; không dùng `git push --no-verify`.

### Không có AI log

Kiểm tra IDE có mở đúng root `P-054/` hay không. Xem
[AI_LOGGING_SETUP.md](AI_LOGGING_SETUP.md).

## 🐳 Docker local

```bash
make up
docker compose ps
make down
```

`db` và `backend` phải ở trạng thái `healthy`; `frontend` ở trạng thái `running`.
`NEXT_PUBLIC_*` được nhúng lúc build, vì vậy thay backend URL trong
`build.args.NEXT_PUBLIC_API_BASE_URL` của `docker-compose.yml` rồi build lại.

Compose hiện tại chỉ dùng cho local development. Trước khi triển khai lên VPS cần ADR và
runbook riêng cho HTTPS reverse proxy, secrets, migrations, backup, monitoring, CD và
rollback.

## 👥 Đội Cuvée Tech

| Họ tên | Vai trò |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Developer |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend |

## Liên kết

- [Jira backlog VMEC](https://cuveetech.atlassian.net/jira/software/projects/VMEC/boards/5/backlog)
- [GATE 1](gate/gate_1/README.md)
- [Sơ đồ kiến trúc](docs/architecture_diagram.md)
- [JOURNAL](JOURNAL.md) · [WORKLOG](WORKLOG.md)
- [Technical Guidebook của chương trình](https://phoenix.note.transformerlabs.ai/technical-book)
