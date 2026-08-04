SHELL := /bin/bash

.PHONY: help install run test lint format check ingest-pilot up down clean \
        migrate migration migrate-down \
        web-install web web-build web-lint dev

help:
	@echo "install      — uv sync (tạo .venv ở repo root)"
	@echo "run          — chạy API dev tại http://localhost:8000"
	@echo "test         — pytest backend/tests"
	@echo "lint         — ruff check"
	@echo "format       — ruff format"
	@echo "check        — lint + format --check + test (giống backend CI)"
	@echo "ingest-pilot — trích xuất thử 50 thuốc theo PRD"
	@echo "migrate      — alembic upgrade head (áp schema lên DATABASE_URL)"
	@echo "migration    — sinh revision mới: make migration m=\"mô tả\""
	@echo "migrate-down — lùi lại một revision"
	@echo "up / down    — docker compose"
	@echo ""
	@echo "web-install  — yarn install cho frontend"
	@echo "web          — chạy Next.js dev tại http://localhost:3000"
	@echo "web-build    — next build"
	@echo "web-lint     — eslint"
	@echo "dev          — chạy SONG SONG backend :8000 + frontend :3000"

install:
	uv sync

run:
	uv run uvicorn medsafe.main:app --reload --host 0.0.0.0 --port 8000

test:
	uv run pytest backend/tests -v

lint:
	uv run ruff check backend/

format:
	uv run ruff format backend/

check:
	uv run ruff check backend/
	uv run ruff format --check backend/
	uv run pytest backend/tests -q

ingest-pilot:
	uv run python -m medsafe.ingestion.cli --limit 50

# Migration chạy trên DATABASE_URL trong .env ở repo root — kiểm tra đang trỏ đúng
# project Supabase trước khi chạy.
migrate:
	uv run alembic -c backend/alembic.ini upgrade head

migration:
	@test -n "$(m)" || (echo "Thiếu mô tả: make migration m=\"add drug table\"" && exit 1)
	uv run alembic -c backend/alembic.ini revision --autogenerate -m "$(m)"

migrate-down:
	uv run alembic -c backend/alembic.ini downgrade -1

web-install:
	cd frontend && yarn install

web:
	cd frontend && yarn dev

web-build:
	cd frontend && yarn build

web-lint:
	cd frontend && yarn lint

# Ctrl-C dừng cả hai: trap kill 0 giết nguyên process group.
dev:
	@trap 'kill 0' EXIT INT TERM; \
	uv run uvicorn medsafe.main:app --reload --host 0.0.0.0 --port 8000 & \
	(cd frontend && yarn dev) & \
	wait

up:
	docker compose up -d --build

down:
	docker compose down

clean:
	find . -type d -name __pycache__ -not -path "./.venv/*" -exec rm -rf {} +
	find . -type d -name .pytest_cache -not -path "./.venv/*" -exec rm -rf {} +
	find . -type d -name .ruff_cache -not -path "./.venv/*" -exec rm -rf {} +
