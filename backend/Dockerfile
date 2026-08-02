# Build context = REPO ROOT (không phải backend/), vì uv.lock nằm ở workspace root.
#   docker build -f backend/Dockerfile .
# Xem docker-compose.yml: context: .  /  dockerfile: backend/Dockerfile

# ---- Stage 1: Build ----
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Cài deps trước, tách khỏi source để tận dụng layer cache
COPY pyproject.toml uv.lock ./
COPY backend/pyproject.toml backend/pyproject.toml
RUN uv sync --frozen --no-dev --no-install-project

# Rồi mới copy source và cài chính package
COPY backend/src backend/src
RUN uv sync --frozen --no-dev

# ---- Stage 2: Runtime ----
FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
COPY backend/config.yaml /app/backend/config.yaml
ENV PATH=/app/.venv/bin:$PATH

# Security: chạy bằng user thường
RUN useradd -m appuser \
    && mkdir -p /app/data /app/logs \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "medsafe.main:app", "--host", "0.0.0.0", "--port", "8000"]
