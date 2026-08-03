SHELL := /bin/bash

.PHONY: help install run test lint format check ingest-pilot up down clean \
        web-install web web-build web-lint dev

help:
	@echo "install      — uv sync (tạo .venv ở repo root)"
	@echo "run          — chạy API dev tại http://localhost:8000"
	@echo "test         — pytest backend/tests"
	@echo "lint         — ruff check"
	@echo "format       — ruff format"
	@echo "check        — lint + format --check + test (giống CI)"
	@echo "ingest-pilot — trích xuất thử 50 thuốc theo PRD"
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
