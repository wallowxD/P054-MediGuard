# 💊 Medication Safety Copilot — Cuvée Tech (P-054)

> Patients have to look up each medicine and cross-check every pair themselves → **an AI
> agent that looks up drug–drug and drug–food interactions with cited sources**, set inside
> the *"Health System X"* web app.

The agent acts as a **reference safety warning**: it shows the verbatim quote, its source
and the review status. It **does not draw clinical conclusions and does not replace a
doctor's judgement.**

---

## Problem

The hospital's medicine catalogue **has no interaction data attached**. Users have to look
up each medicine, read the PDF leaflet themselves, and cross-check every pair by hand —
slow, easy to get wrong by omission, and hard to judge severity without clinical training.

Existing tools are either in English, or do not match the brand names sold in Vietnam, or
state conclusions without showing a source.

## Solution

- **Drug–drug interaction lookup** — enter several medicines; the system generates every
  pair to check and looks them up in human-reviewed data.
- **Drug–food interaction lookup** — semantic search over leaflet text, returning the
  verbatim passage.
- **Visual severity with cited sources** — every warning carries the original quote and a
  link to the leaflet.
- **Non-blocking human-in-the-loop** — warnings appear immediately, labelled *"awaiting
  professional confirmation"*, while pharmacists review in parallel.

### The three rules that never bend

1. **Never invent a warning** — no citation, no warning; return "no data available".
2. **Never draw clinical conclusions** — no diagnosis, no medicine changes, no dosing.
3. **Human-in-the-loop must not block the flow** — no full-gate model.

## Target users

- **Primary** — patients and carers: quick lookups from a medicine list, a photo or a PDF.
- **Secondary** — doctors and pharmacists: review the quote and source, then confirm.

---

## Tech stack

| Layer | Technology |
|---|---|
| AI agent | LangGraph + LangChain |
| RAG | ChromaDB + OpenAI embeddings · pypdf |
| Backend | FastAPI + Uvicorn · Python 3.11+ |
| Drug-name matching | rapidfuzz + unidecode (fuzzy matching for Vietnamese) |
| Frontend | Next.js 16 (App Router) + React 19 + strict TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL 16 (prod) / SQLite (dev) · SQLAlchemy + Alembic |
| Tooling | uv (Python) · Yarn 4 (Node) · ruff · pytest |
| DevOps | Docker Compose + GitHub Actions |

---

## 🚀 Running the project

### ⚠️ Read this first

**Always open the repository at its root, `P-054/`.** Never open `backend/` or `frontend/`
as the IDE workspace.

The AI logging hooks use paths relative to the repository root. Opened in a subdirectory,
the tool cannot find `.claude/` or `.cursor/` → **no hook runs, nothing is logged, and no
error is reported**. You can push for a week and score zero on AI logs.

### Prerequisites

| Requirement | Version | Check |
|---|---|---|
| Python | 3.11+ | `python3 --version` |
| [uv](https://docs.astral.sh/uv/) | latest | `uv --version` |
| Node.js | 20+ (we use 24) | `node -v` |
| Corepack (ships with Node) | enable it | `corepack enable` |
| Docker Desktop | optional | only needed to run Postgres in a container |

Do **not** install Yarn with `npm i -g yarn`. The repo pins `yarn@4.18.0` through the
`packageManager` field in `frontend/package.json`; running `corepack enable` once is
enough for corepack to fetch the right version.

### Step 1 — Clone and configure git

```bash
git clone https://github.com/AI20K-Build-Phase-Cohort-3/P-054.git
cd P-054
git config user.email "the-email-registered-with-the-programme@gmail.com"
```

The email must be **the one registered with the programme**, or your logs are credited to
someone else.

### Step 2 — Create `.env`

```bash
cp .env.example .env
```

Open `.env` and fill in `OPENAI_API_KEY`. Take `AI_LOG_API_KEY` from **your own invitation
link** — the value in `.env.example` is only a placeholder.

> `.env` lives at the **repository root**, not in `backend/`. `backend/.env.example` exists
> only to document variable names.

### Step 3 — Install the AI logging hooks (once)

```bash
bash scripts/setup_hooks.sh
```

Required — this is a graded deliverable. The hooks log prompts from Claude Code, Cursor,
Codex, Gemini CLI, Copilot and Antigravity, and submit them automatically on `git push`.

### Step 4 — Install dependencies

```bash
make install        # backend: uv sync, creates .venv at the repo root
make web-install    # frontend: yarn install
```

### Step 5 — Run

```bash
make dev            # ★ runs backend :8000 and frontend :3000 together
```

Or run them separately in two terminals:

```bash
make run            # backend only  -> http://localhost:8000
make web            # frontend only -> http://localhost:3000
```

Every command runs **from the repository root**; there is no need to `cd` into `backend/`
or `frontend/`.

### Step 6 — Verify

| URL | Expected |
|---|---|
| http://localhost:3000 | The landing page |
| http://localhost:8000/docs | Swagger UI |
| http://localhost:8000/health | `{"status": "ok", "env": "development"}` |

A single `Ctrl-C` stops both processes.

---

## 🛠 Command reference

Run `make help` for the full list.

| Command | Purpose |
|---|---|
| `make install` | `uv sync` — creates `.venv` at the repo root |
| `make run` | Backend dev server on :8000 |
| `make test` | `pytest backend/tests` |
| `make lint` / `make format` | ruff check / ruff format |
| `make check` | lint + format --check + tests (same as CI) |
| `make ingest-pilot` | Extract a 50-medicine pilot set, per the PRD |
| `make web-install` | `yarn install` for the frontend |
| `make web` | Next.js dev server on :3000 |
| `make web-build` / `make web-lint` | build / eslint |
| `make dev` | **Backend and frontend together** |
| `make up` / `make down` | docker compose |

---

## 📁 Structure

This repository is a **workspace**: the whole project context lives in git —
specification, architecture decisions, planning. The team and AI tools read the same
source.

All documentation sits **outside** the source directories: `backend/` and `frontend/`
contain code only.

```
P-054/
├── README.md           you are here — start of the trail
├── AGENTS.md           the rules for AI tools and the team
├── specs/              ★ what we are building, and why
├── adrs/               ★ decisions we made, and why
├── planning/           backlog, sprints, open questions
├── docs/               how to work on the code
│   ├── backend.md      backend guide
│   ├── frontend.md     frontend guide
│   ├── architecture_diagram.md
│   └── guide/          the programme's guidebook (reference)
├── backend/            source only — FastAPI + LangGraph + ChromaDB (package: medsafe)
├── frontend/           source only — Next.js App Router + TS + Tailwind
├── dataset/            hospital medicine catalogue + interaction pairs
├── gate/gate_1/        ★ SUBMITTED — never edit, delete or rename
├── eval/  presentation/  scripts/
├── WORKLOG.md  JOURNAL.md
├── .env  .venv/        ★ must live at the repo root
└── Makefile
```

### Where a newcomer should start

Read these five, in order. It takes about twenty minutes.

| # | File | Answers |
|---|---|---|
| 1 | [specs/product-vision.md](specs/product-vision.md) | What we are building, and **the three rules that never bend** |
| 2 | [specs/domains.md](specs/domains.md) | The shared vocabulary, and the RAG boundary |
| 3 | [adrs/README.md](adrs/README.md) | Why the code looks the way it does |
| 4 | [planning/backlog.md](planning/backlog.md) | What is left, and what is blocked |
| 5 | [AGENTS.md](AGENTS.md) | Coding conventions and no-go areas |

Then, right before you write code:

| Working on | Read |
|---|---|
| Anything | [docs/code-style.md](docs/code-style.md) — which library for which job, naming |
| Backend | [docs/backend.md](docs/backend.md) |
| Frontend | [docs/frontend.md](docs/frontend.md) |
| Anything that produces a warning | [ADR 0004](adrs/0004-drug-drug-lookup-not-similarity.md), [0005](adrs/0005-human-in-the-loop-non-blocking.md), [0006](adrs/0006-citation-required-for-every-warning.md) — required |

---

## 🩺 Common problems

**`sh: next: command not found`**, or a Turbopack error about *"couldn't find the Next.js
package"* — `frontend/node_modules` is missing. Run `make web-install` again. Do not use
`npx next dev`: npx downloads a different `next` into a temporary cache and the resulting
error points in the wrong direction.

**A port is still busy after `Ctrl-C`** — this happens when the `make dev` process is
killed by PID (closing the terminal abruptly, or killing it from Activity Monitor) rather
than interrupted:

```bash
pkill -f "uvicorn medsafe"; pkill -f "next dev|next-server"
```

**The pre-push hook fails** — **tell the team lead**; never use `git push --no-verify`, as
that skips the AI-log submission.

**Zero AI logs** — almost certainly because the IDE was opened at `backend/` or `frontend/`
instead of the repository root. See [AI_LOGGING_SETUP.md](AI_LOGGING_SETUP.md).

**Using ChatGPT / Claude.ai / Gemini Web** (no hooks) — log manually:

```bash
bash scripts/_pyrun.sh scripts/log_manual.py --tool chatgpt --prompt "What you asked"
```

---

## 🐳 Docker

Run the whole stack (Postgres + backend + frontend) in containers, with no need for uv or
Node on the host:

```bash
make up      # docker compose up -d --build
make down
```

Check with `docker compose ps` — all three services should report `healthy`. The URLs are
the same as when running locally (`:3000`, `:8000/docs`).

> **To change the backend URL used by the frontend:** edit
> `build.args.NEXT_PUBLIC_API_BASE_URL` in `docker-compose.yml`, **not** `environment`.
> `NEXT_PUBLIC_*` variables are baked into the bundle at build time, so setting them at
> runtime has no effect. After changing it, run `make up` again to rebuild the image.

---

## 👥 Team — Cuvée Tech

| Name | Role |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Dev |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend |

## 🔗 Links

- **GATE 1** (Brief + PRD + UI flow): [gate/gate_1/README.md](gate/gate_1/README.md)
- **Development log:** [JOURNAL.md](JOURNAL.md) · [WORKLOG.md](WORKLOG.md)
- **Architecture:** [docs/architecture_diagram.md](docs/architecture_diagram.md)
- **Technical Guidebook:** [phoenix.note.transformerlabs.ai/technical-book](https://phoenix.note.transformerlabs.ai/technical-book)
