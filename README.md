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
| Dữ liệu | Supabase PostgreSQL + private Storage (dùng chung cho cả development và production) |
| Triển khai | Một VPS · Caddy reverse proxy lo HTTPS — xem [docs/deployment.md](docs/deployment.md) |
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
openssl rand -base64 32
```

Điền secret vừa sinh vào `NEXTAUTH_SECRET` trong `.env`. Chỉ cấu hình credential cần cho
phần việc đang làm. Mỗi thành viên dùng `AI_LOG_API_KEY` cá nhân.

> **Dự án chỉ có một file `.env`, đặt tại repository root.** Next.js vốn không đọc file env
> ngoài thư mục của nó, nên [frontend/load-root-env.ts](frontend/load-root-env.ts) làm cầu
> nối: nó nạp vào process của Next **chỉ** những key có tiền tố `NEXT_PUBLIC_` hoặc
> `NEXTAUTH_`, còn secret backend nằm cùng file thì không bao giờ lọt qua.
>
> **Không tạo `frontend/.env` hay `frontend/.env.local`.** Next.js đọc chúng trước, nên
> chúng sẽ ghi đè và làm `.env` ở root mất tác dụng một cách âm thầm.

Nếu làm việc với backend auth, cần thêm hai biến trong `.env`:

```bash
openssl rand -hex 32   # dán vào JWT_SECRET_KEY
```

`DATABASE_URL` lấy từ Supabase → Project Settings → Database → Connection string, chọn
**Session pooler (cổng 5432)**, đổi tiền tố `postgresql://` thành `postgresql+psycopg://`
và percent-encode ký tự đặc biệt trong mật khẩu (`@` → `%40`). Sau đó chạy `make migrate`.

- Toàn bộ biến môi trường: `.env` tại root. Không commit file này.
- `.env.example` là tài liệu tên biến, có kèm block giá trị dành cho production.

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

### Bước 7 — Dừng khi xong việc

`make dev` và `make up` là **hai thế giới tách biệt**, cách dừng khác nhau:

| Bạn khởi động bằng | Chạy ở đâu | Cách dừng |
|---|---|---|
| `make dev` / `make run` / `make web` | thẳng trên máy, chiếm terminal | `Ctrl-C` — hết |
| `make up` | container Docker, chạy nền | `make down` |

**Với `make dev` thì `Ctrl-C` là đủ, không cần `make down`.** Target `dev` trong Makefile
đặt `trap 'kill 0'`, nên một lần `Ctrl-C` giết cả backend lẫn frontend và trả lại cả hai
cổng.

**Với `make up` thì `Ctrl-C` vô tác dụng** — container chạy nền, đóng terminal nó vẫn sống
và vẫn giữ cổng 3000/8000. Bắt buộc `make down`.

Chỉ khi nghi ngờ mới cần kiểm tra:

```bash
docker compose ps                          # phải rỗng
lsof -nP -iTCP:3000 -sTCP:LISTEN           # phải rỗng
```

Hằng ngày bạn chỉ dùng `make dev`. `make up` để dành cho lúc cần kiểm tra đúng thứ sẽ chạy
trên VPS — và nhớ `make down` trước khi quay lại `make dev`, vì hai bên tranh nhau cùng cổng.

## 🔁 Quay lại làm việc hôm sau

```bash
cd P-054
git pull --ff-only        # hoặc: git checkout VMEC-NN của bạn
make install              # đồng bộ dependency Python
make web-install          # đồng bộ dependency frontend
make migrate              # áp migration mới nếu có
make dev
```

Cứ chạy đủ cả 5 lệnh, **không cần phân vân lệnh nào là thừa**. Khi không có gì thay đổi
thì `make install` mất ~0,1s và `make web-install` mất ~0,5s vì chúng chỉ đối chiếu
lockfile; `make migrate` cũng không làm gì nếu schema đã ở bản mới nhất.

Không cần `cp .env.example .env` lại — `.env` không bị git đụng tới, nó vẫn nằm nguyên chỗ
cũ. Sau khi `git pull`, liệt kê biến có trong `.env.example` mà `.env` của bạn chưa có:

```bash
comm -23 <(grep -o '^[A-Z_]*=' .env.example | sort -u) <(grep -o '^[A-Z_]*=' .env | sort -u)
```

Phần lớn kết quả là biến **tùy chọn** (OCR, Qdrant, Vertex…) — chỉ điền khi bạn làm đúng
phần việc đó. Bốn biến gần như ai cũng cần: `DATABASE_URL`, `JWT_SECRET_KEY`,
`NEXTAUTH_SECRET`, `AI_LOG_API_KEY`.

Ba lệnh `install` / `web-install` / `migrate` chạy thừa cũng vô hại, nên khi phân vân thì
cứ chạy.

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
| `make migrate-down` | Lùi lại một revision |
| `make web-install` | Cài dependency frontend bằng Yarn |
| `make web` | Chạy frontend tại cổng 3000 |
| `make web-lint` / `make web-build` | ESLint / production build |
| `make dev` | Chạy frontend và backend song song |
| `make up` / `make down` | Khởi động/dừng Docker Compose local |
| `make clean` | Xoá cache `__pycache__`, `.pytest_cache`, `.ruff_cache` |
| `make prod-config` | Validate cấu hình deploy trước khi lên VPS |
| `make prod-up` / `make prod-down` | Deploy/dừng stack production kèm Caddy |
| `make prod-logs` | Theo dõi log production |

Quên lệnh thì chạy `make help` — nó liệt kê toàn bộ target kèm mô tả.

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
├── gate/               hồ sơ nộp theo từng gate
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

Tạo branch — tên branch đúng bằng Jira key, không thêm tiền tố hay mô tả:

```bash
git checkout main
git pull --ff-only
git checkout -b VMEC-NN
```

Commit trên branch đó dùng Conventional Commits với **scope là Jira key**:

```bash
git commit -m "feat(VMEC-NN): add drug catalog browsing endpoints"
```

`type` ∈ `feat` · `fix` · `docs` · `refactor` · `chore` · `test` · `ci` · `perf`. Mô tả viết
tiếng Anh, thể mệnh lệnh, không dấu chấm cuối. Không đặt ticket key ở cuối câu.

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

PR phải link Jira issue và spec, nêu rõ kết quả kiểm thử, đồng thời pass toàn bộ GitHub
checks. Không commit secret, `.ai-log/`, generated API types hoặc logging scripts. Sửa
`gate/` thì theo [ADR 0019](adrs/0019-gate-1-no-longer-immutable.md).

## Các lỗi thường gặp

### `next: command not found`

Chạy lại `make web-install`. Không dùng `npx next dev`.

### Port vẫn bận sau `Ctrl-C`

Nguyên nhân hay gặp nhất: stack Docker vẫn đang chạy nền từ lần `make up` trước. `Ctrl-C`
không dừng được nó. Kiểm tra trước tiên:

```bash
docker compose ps      # có container nào không?
make down              # nếu có
```

Nếu vẫn bận thì mới truy process trên host:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

Xác định đúng PID của process development rồi mới dừng; không dùng pattern kill rộng trên
máy dùng chung.

### Đăng nhập báo "Không thể đăng nhập. Vui lòng thử lại."

Nếu đang chạy bằng Docker, xem log backend có nhận được request không:

```bash
docker compose logs backend | grep auth/login
```

Không thấy dòng nào nghĩa là request chết trong container frontend, không phải sai mật
khẩu. Xem mục xử lý sự cố trong [docs/deployment.md](docs/deployment.md).

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

`backend` phải ở trạng thái `healthy`, `frontend` ở trạng thái `running`. Compose không có
service database: `DATABASE_URL` trong `.env` trỏ thẳng tới Supabase, giống hệt `make dev`.

`NEXT_PUBLIC_*` được nhúng vào bundle lúc build chứ không đọc lúc chạy. Đổi giá trị trong
`.env` rồi restart là vô tác dụng — phải build lại, và `make up` đã kèm `--build`.

## 🚀 Triển khai VPS

Frontend và backend là hai container riêng trên cùng một VPS, đứng sau reverse proxy Caddy
lo HTTPS. Một domain duy nhất, tách theo path: `/api/v1/*` sang backend, phần còn lại sang
frontend.

```bash
make prod-config    # validate, biến thiếu báo lỗi ngay
make prod-up
```

Quy trình đầy đủ — DNS, chứng chỉ, biến production, Google OAuth, rollback — nằm trong
[docs/deployment.md](docs/deployment.md).

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
