# Kế hoạch tái cấu trúc repo — PR 1

> Cho team Cuvée Tech (P-054). Đọc trước khi mở PR restructure.
> **Merge PR này trước mọi PR feature.** Đây là PR đụng nhiều file nhất — kèm tính năng
> vào là không review nổi và conflict với 3 người còn lại.

## Ràng buộc bất biến

| Không được đụng | Lý do |
|---|---|
| `gate/gate_1/` (4 file) | Đã submit GATE 1 |
| `scripts/`, `.ai-log/` | Hạ tầng AI logging của BTC |
| `.env` ở root | `submit_log.py` gọi `load_dotenv()` theo CWD = root |
| `.venv/` ở root | `scripts/_pyrun.sh` chỉ tìm venv ở repo root |
| Khối `hooks` trong `.claude/settings.json`, `.cursor/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`, `.github/hooks/hooks.json` | Hook logging |

## Đã xong (không cần làm lại)

- `AGENTS.md` + `CLAUDE.md` — ngữ cảnh dùng chung cho mọi AI tool
- `.claude/agents/` — 3 subagent · `.claude/commands/` — 3 slash command
- `.cursor/rules/project.mdc` · `.github/copilot-instructions.md`
- `.gitignore` — thêm `.claude/settings.local.json`
- `backend/`, `frontend/`, `gate/gate_2/` — thư mục rỗng có `.gitkeep`

## Còn phải làm

### Bước 1 — Di chuyển code

```bash
git mv src backend/src_old && mkdir -p backend/src/medsafe
git mv backend/src_old/* backend/src/medsafe/ && rmdir backend/src_old
git mv tests backend/tests_old && git mv backend/tests_old/* backend/tests/ && rmdir backend/tests_old
git mv Dockerfile backend/Dockerfile
git rm requirements.txt ruff.toml README_boilerplate.md
rm backend/.gitkeep
```

Rồi sửa **8 dòng import** `src.*` → `medsafe.*`:
`main.py` (2) · `services/llm.py` (1) · `agents/graph.py` (2) · `api/routes.py` (2) ·
`agents/nodes/example_node.py` (1) · `tests/conftest.py` (1) · `tests/test_agents/test_graph.py` (1)

Kiểm tra không sót: `grep -rn "from src\.\|import src\." backend/` → phải rỗng.

### Bước 2 — `pyproject.toml` ở root (uv workspace, virtual root)

```toml
[tool.uv.workspace]
members = ["backend"]

[dependency-groups]
dev = ["ruff>=0.8.0", "pytest>=8.0.0", "pytest-asyncio>=0.24.0", "httpx>=0.28.0"]
```

Không có bảng `[project]` — đây là *virtual root*, `uv sync` sẽ tạo `.venv` **ở root**
và cài `medsafe` dạng editable. Nhờ vậy `eval/run_eval.py` và `scripts/` ở root
`import medsafe` được, và `_pyrun.sh` không cần sửa dòng nào.

### Bước 3 — `backend/pyproject.toml`

```toml
[project]
name = "medsafe"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0", "uvicorn[standard]>=0.34.0",
    "pydantic>=2.10.0", "pydantic-settings>=2.7.0", "python-dotenv>=1.0.0",
    "langchain>=0.3.0", "langchain-openai>=0.3.0", "langgraph>=0.2.0",
    "sqlalchemy>=2.0.0", "alembic>=1.14.0", "psycopg[binary]>=3.2.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/medsafe"]

[tool.ruff]
target-version = "py311"
line-length = 120

[tool.ruff.lint]
select = ["E", "F", "I", "N", "W", "UP"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
```

⚠️ **`python-dotenv` phải nằm trong đây**, nếu không `.venv` ở root sẽ thiếu nó và
`submit_log.py` im lặng bỏ qua bước submit.

### Bước 4 — `config.py` tìm `.env` ở root

`.env` ở root nhưng process chạy từ `backend/`, nên phải trỏ đường dẫn tuyệt đối:

```python
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[3]   # backend/src/medsafe/config.py → repo root

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ROOT / ".env", ...)
```

### Bước 5 — Docker

> **Đính chính so với bản đề xuất trước:** tôi từng viết `context: ./backend`.
> **Sai.** Với uv workspace, `uv.lock` nằm ở **repo root** — build context `./backend`
> sẽ không thấy lockfile. Backend phải build với **context = repo root**.
> Hệ quả: `.dockerignore` ở **root** vẫn là file có tác dụng cho backend (không phải
> `backend/.dockerignore`).

`backend/Dockerfile`:
```dockerfile
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder
WORKDIR /app
COPY pyproject.toml uv.lock ./
COPY backend/pyproject.toml backend/pyproject.toml
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/src backend/src
RUN uv sync --frozen --no-dev

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
ENV PATH=/app/.venv/bin:$PATH
RUN useradd -m appuser && mkdir -p /app/data && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1
CMD ["uvicorn", "medsafe.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`docker-compose.yml`:
```yaml
services:
  backend:
    build:
      context: .                    # ← repo root, KHÔNG phải ./backend
      dockerfile: backend/Dockerfile
    ports: ["8000:8000"]
    env_file: [.env]
    depends_on: [db]
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend           # lockfile npm nằm trong frontend/ → context này đúng
    ports: ["3000:3000"]
    depends_on: [backend]
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: medsafe
      POSTGRES_PASSWORD: medsafe
      POSTGRES_DB: medsafe
    volumes: ["pgdata:/var/lib/postgresql/data"]
    restart: unless-stopped

volumes:
  pgdata:
```

Bổ sung vào `.dockerignore` ở root: `frontend/`, `docs/`, `gate/`, `presentation/`,
`eval/`, `dataset/`, `.ai-log/`.

### Bước 6 — CI

`.github/workflows/ci.yml` tách 2 job, thêm `paths` filter để đổi FE không chạy lại test BE:

```yaml
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with: { enable-cache: true }
      - run: uv sync --all-extras --dev
      - run: uv run ruff check backend/
      - run: uv run pytest backend/tests -v --tb=short
        env: { APP_ENV: test, OPENAI_API_KEY: test-key }
```

### Bước 7 — Makefile ở root

Đổi mọi target sang `uv run ...` và trỏ đúng `backend/`.

### Bước 8 — Dọn tài liệu

- Bê phần *Design Decisions* + *Security* từ `ARCHITECTURE.md` sang
  `docs/architecture_diagram.md`, rồi `git rm ARCHITECTURE.md`.
  Lý do giữ file trong `docs/`: checklist BTC gọi đúng path đó.
- Cập nhật lệnh cài trong `README.md` và `AI_LOGGING_SETUP.md`:
  `uv venv && uv pip install -r requirements.txt` → **`uv sync`**

## Nghiệm thu — chạy đủ 5 lệnh

```bash
git ls-files gate/ | wc -l                      # phải = 4
grep -rn "from src\.\|import src\." backend/    # phải rỗng
uv sync && uv run pytest && uv run ruff check
bash scripts/_pyrun.sh scripts/submit_log.py    # PHẢI IN RA KẾT QUẢ
docker compose up --build
```

**Lệnh thứ 4 quan trọng nhất.** `_pyrun.sh` được thiết kế *thoát 0 im lặng khi không
tìm thấy Python* để không chặn AI tool — nên "không báo gì" **không** đồng nghĩa với
"chạy được". Phải nhìn thấy output thật.

## Sau khi merge

Báo cả team:
```bash
git pull
rm -rf .venv && uv sync
```
Và nhắc lại: **mở repo ở root `P-054/`**, không mở `backend/` hay `frontend/` làm
workspace — mở sai chỗ là hook logging không chạy, không có cảnh báo nào.
