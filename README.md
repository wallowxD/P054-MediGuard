# 💊 Medication Safety Copilot — Cuvée Tech (P-054)

> Người bệnh phải tự tra từng thuốc và tự đối chiếu từng cặp tương tác → **AI Agent
> tra cứu tương tác thuốc–thuốc và thuốc–thực phẩm có trích dẫn nguồn**, đặt trong
> bối cảnh web app *"Hệ thống y tế X"*.

Agent đóng vai trò **cảnh báo an toàn tham khảo**: hiển thị nguyên văn đoạn trích kèm
nguồn và trạng thái review. **Không tự kết luận lâm sàng, không thay thế quyết định
của bác sĩ.**

---

## Vấn đề

Danh mục thuốc của bệnh viện **không có sẵn dữ liệu tương tác**. Người dùng phải tự
tra từng thuốc, tự đọc tờ HDSD dạng PDF và tự đối chiếu nhiều cặp — quy trình chậm,
dễ bỏ sót, và khó tự đánh giá mức độ nghiêm trọng.

Các công cụ tra cứu sẵn có thì hoặc bằng tiếng Anh, hoặc không khớp với biệt dược lưu
hành tại Việt Nam, hoặc đưa ra kết luận mà không cho thấy nguồn.

## Giải pháp

- **Tra tương tác thuốc–thuốc** — nhập nhiều thuốc, hệ thống sinh mọi cặp cần tra và
  đối chiếu theo bảng dữ liệu đã được người review.
- **Tra tương tác thuốc–thực phẩm** — tìm kiếm ngữ nghĩa trên nội dung tờ HDSD, trả
  về đoạn trích nguyên văn.
- **Severity trực quan + trích dẫn nguồn** — mỗi cảnh báo gắn với đoạn trích gốc và
  link tới tờ HDSD.
- **Human-in-the-loop không chặn luồng** — cảnh báo hiển thị ngay kèm nhãn *"chờ xác
  nhận chuyên môn"*; dược sĩ duyệt song song.

### Ba luật bất di bất dịch

1. **Không bịa cảnh báo** — không có trích dẫn thì không có cảnh báo, trả về "chưa có dữ liệu".
2. **Không kết luận lâm sàng** — không chẩn đoán, không đổi thuốc, không đưa liều.
3. **Human-in-the-loop không chặn luồng** — không implement mô hình full-gate.

## Target User

- **Primary** — bệnh nhân / người chăm sóc: tra nhanh từ danh sách thuốc, ảnh hoặc PDF.
- **Secondary** — bác sĩ / dược sĩ: review đoạn trích, nguồn và xác nhận kết quả.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Agent | LangGraph + LangChain |
| RAG | ChromaDB + OpenAI embeddings · pypdf |
| Backend | FastAPI + Uvicorn · Python 3.11+ |
| Chuẩn hoá tên thuốc | rapidfuzz + unidecode (khớp mờ tiếng Việt) |
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL 16 (prod) / SQLite (dev) · SQLAlchemy + Alembic |
| Tooling | uv (Python) · Yarn 4 (Node) · ruff · pytest |
| DevOps | Docker Compose + GitHub Actions |

---

## 🚀 Chạy dự án

### ⚠️ Đọc trước

**LUÔN mở repo ở thư mục gốc `P-054/`.** Không mở thẳng `backend/` hay `frontend/`
làm workspace trong IDE.

Hook AI logging dùng đường dẫn tương đối từ repo root. Mở ở thư mục con thì tool
không tìm thấy `.claude/` / `.cursor/` → **không hook nào chạy, không log gì cả, và
không báo lỗi**. Push cả tuần mà điểm AI log bằng 0.

### Yêu cầu cài sẵn

| Cần | Bản | Kiểm tra |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| [uv](https://docs.astral.sh/uv/) | mới nhất | `uv --version` |
| Node.js | 20+ (đang dùng 24) | `node -v` |
| Corepack (kèm sẵn Node) | bật lên | `corepack enable` |
| Docker Desktop | tuỳ chọn | chỉ cần nếu chạy Postgres bằng container |

Yarn **không cài bằng `npm i -g yarn`**. Repo pin sẵn `yarn@4.18.0` qua trường
`packageManager` trong `frontend/package.json`; chạy `corepack enable` một lần là
corepack tự lấy đúng bản.

### Bước 1 — Clone và cấu hình git

```bash
git clone https://github.com/AI20K-Build-Phase-Cohort-3/P-054.git
cd P-054
git config user.email "email-da-dang-ky-voi-BTC@gmail.com"
```

Email phải **đúng email đã đăng ký với BTC**, sai là log tính sang người khác.

### Bước 2 — Tạo file `.env`

```bash
cp .env.example .env
```

Mở `.env` và điền `OPENAI_API_KEY`. `AI_LOG_API_KEY` lấy từ **link mời riêng của
BTC** — giá trị trong `.env.example` chỉ là placeholder.

> `.env` nằm ở **repo root**, không phải `backend/.env`. File `backend/.env.example`
> chỉ để tra tên biến.

### Bước 3 — Cài AI logging hooks (chạy một lần)

```bash
bash scripts/setup_hooks.sh
```

Bắt buộc — đây là deliverable được chấm. Hook tự log prompt của Claude Code, Cursor,
Codex, Gemini CLI, Copilot, Antigravity và tự submit khi `git push`.

### Bước 4 — Cài dependencies

```bash
make install        # backend: uv sync, tạo .venv ở repo root
make web-install    # frontend: yarn install
```

### Bước 5 — Chạy

```bash
make dev            # ★ chạy SONG SONG backend :8000 + frontend :3000
```

Hoặc chạy riêng từng bên ở hai terminal:

```bash
make run            # chỉ backend  -> http://localhost:8000
make web            # chỉ frontend -> http://localhost:3000
```

Mọi lệnh chạy **từ repo root**, không cần `cd` vào `backend/` hay `frontend/`.

### Bước 6 — Kiểm tra

| URL | Kỳ vọng |
|---|---|
| http://localhost:3000 | Trang Next.js |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/health | `{"status": "ok", "env": "development"}` |

`Ctrl-C` một lần dừng cả hai tiến trình.

---

## 🛠 Bảng lệnh

Chạy `make help` để xem đầy đủ.

| Lệnh | Việc |
|---|---|
| `make install` | `uv sync` — tạo `.venv` ở repo root |
| `make run` | API dev tại :8000 |
| `make test` | `pytest backend/tests` |
| `make lint` / `make format` | ruff check / ruff format |
| `make check` | lint + format --check + test (giống CI) |
| `make ingest-pilot` | trích xuất thử 50 thuốc theo PRD |
| `make web-install` | `yarn install` cho frontend |
| `make web` | Next.js dev tại :3000 |
| `make web-build` / `make web-lint` | build / eslint |
| `make dev` | **backend + frontend song song** |
| `make up` / `make down` | docker compose |

---

## 📁 Cấu trúc

```
P-054/
├── backend/            FastAPI + LangGraph + ChromaDB (package: medsafe)
│   ├── config.yaml     tham số RAG — KHÔNG chứa secret
│   ├── src/medsafe/    layout theo pipeline RAG, mỗi bước một thư mục
│   └── tests/
├── frontend/           Next.js App Router + TS + Tailwind
├── dataset/            danh mục thuốc BV GTVT + cặp tương tác
├── gate/gate_1/        ★ ĐÃ SUBMIT — không sửa/xoá/đổi tên
├── docs/  eval/  presentation/  scripts/
├── .env  .venv/        ★ bắt buộc ở repo root
└── Makefile
```

Chi tiết backend: [backend/README.md](backend/README.md) ·
Quy ước code và ranh giới kiến trúc: [AGENTS.md](AGENTS.md)

---

## 🩺 Lỗi thường gặp

**`sh: next: command not found`** hoặc lỗi Turbopack *"couldn't find the Next.js
package"* — `frontend/node_modules` bị thiếu. Chạy lại `make web-install`. Đừng dùng
`npx next dev`: npx sẽ tải bản `next` khác vào cache tạm rồi báo lỗi trỏ sai hướng.

**Đã bấm `Ctrl-C` mà cổng vẫn bận** — xảy ra khi tiến trình `make dev` bị giết thẳng
PID (tắt terminal kiểu cứng, kill từ Activity Monitor) thay vì `Ctrl-C`:

```bash
pkill -f "uvicorn medsafe"; pkill -f "next dev|next-server"
```

**Pre-push hook báo lỗi** — **báo lại cho team lead**, tuyệt đối không
`git push --no-verify` (sẽ bỏ qua submit AI log).

**Điểm AI log bằng 0** — gần như chắc chắn do mở IDE ở `backend/` hoặc `frontend/`
thay vì repo root. Xem [AI_LOGGING_SETUP.md](AI_LOGGING_SETUP.md).

**Dùng ChatGPT / Claude.ai / Gemini Web** (không có hook) — log tay:

```bash
bash scripts/_pyrun.sh scripts/log_manual.py --tool chatgpt --prompt "Nội dung đã hỏi"
```

---

## 🐳 Docker

Chạy cả stack (Postgres + backend + frontend) bằng container, không cần cài uv hay
Node trên máy:

```bash
make up      # docker compose up -d --build
make down
```

Kiểm tra: `docker compose ps` — cả ba service phải `healthy`. URL giống hệt lúc chạy
local (`:3000`, `:8000/docs`).

> **Đổi URL backend cho frontend:** sửa `build.args.NEXT_PUBLIC_API_URL` trong
> `docker-compose.yml`, **không** phải `environment`. Biến `NEXT_PUBLIC_*` được nhúng
> thẳng vào bundle lúc build nên đặt ở runtime không có tác dụng. Đổi xong phải
> `make up` lại để build lại image.

---

## 👥 Team — Cuvée Tech

| Họ tên | Vai trò |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Dev |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend |

## 🔗 Liên kết

- **Gate 1** (Brief + PRD + UI Flow): [gate/gate_1/README.md](gate/gate_1/README.md)
- **Nhật ký phát triển:** [JOURNAL.md](JOURNAL.md) · [WORKLOG.md](WORKLOG.md)
- **Kiến trúc:** [docs/architecture_diagram.md](docs/architecture_diagram.md)
- **Technical Guidebook:** [phoenix.note.transformerlabs.ai/technical-book](https://phoenix.note.transformerlabs.ai/technical-book)
