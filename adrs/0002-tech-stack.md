# ADR 0002 — Technology stack

- **Status:** Accepted
- **Date:** 2026-08-02

## Decision

| Layer | Choice | Short reason |
|---|---|---|
| Agent | LangGraph + LangChain | Required by the programme; a state graph fits a multi-step branching flow |
| RAG | ChromaDB + OpenAI embeddings + pypdf | Chroma runs locally with no infrastructure to stand up, and is fine for ~1073 medicines |
| Backend | FastAPI + Uvicorn, Python 3.11 | Async, and it generates OpenAPI, which feeds `types.gen.ts` |
| Name matching | **rapidfuzz + unidecode** | See below |
| Frontend | Next.js 16 App Router + React 19 + strict TypeScript | |
| Styling | Tailwind v4 + shadcn/ui | Dark mode and responsiveness are graded |
| Database | PostgreSQL 16 (prod) / SQLite (dev), SQLAlchemy + Alembic | |
| Python tooling | **uv** (workspace) + ruff + pytest | |
| Node tooling | **Yarn 4** via corepack | |
| DevOps | Docker Compose + GitHub Actions | |

## Two choices that need explaining

### rapidfuzz + unidecode rather than embeddings for drug-name matching

The CSV column names are Vietnamese **without diacritics** (`Biet duoc`,
`Hoat chat - Ham luong`); the JSON content is Vietnamese **with diacritics**. Users type
whatever they type.

For proper nouns, fuzzy matching on diacritic-stripped strings beats embeddings.
Embeddings pull together words with *similar meaning*; here we need words with *similar
spelling*. "Paracetamol" and "Acetaminophen" are semantically close, but a user who types
"paracetamol" must get brand names containing paracetamol, not something merely related.

### A uv workspace with a virtual root

The root `pyproject.toml` has **no `[project]` table** — it is a virtual workspace root
whose only member is `backend/`.

The reason is specific: **uv always creates `.venv` at the workspace root**, and the
programme's `scripts/_pyrun.sh` only looks for a virtualenv at the repository root. If
`pyproject.toml` lived inside `backend/`, the virtualenv would be created at
`backend/.venv`, the AI logging hooks would not run, and **the team would lose AI-log
marks with no error message anywhere**.

This arrangement keeps the hooks working without editing a single line under `scripts/`,
which we are not allowed to modify.

## Consequences

- `.env` and `.venv/` **must** stay at the repository root
- Every Python command runs from the root: `uv run …`, or through `make`
- The frontend pins Yarn 4 via `packageManager` — see [ADR 0008](0008-toolchain-version-pins.md)

## Still open

- The **vision model** used to extract interactions from PDF leaflets has not been chosen
- The embeddings provider may change if cost becomes a problem — it is isolated inside
  `embeddings/`
