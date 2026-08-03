# AGENTS.md — P-054 · Medication Safety Copilot

> Shared context for **every AI tool** working in this repository: Claude Code, Codex,
> Cursor, Gemini CLI, GitHub Copilot, Antigravity.
> This is the **single source of truth**. `CLAUDE.md`, `.cursor/rules/` and
> `.github/copilot-instructions.md` all point back here.

---

## ⚠️ Read this before doing anything

**Always open the repository at its root, `P-054/`.** Never open `backend/` or `frontend/`
as the workspace.

Every logging hook uses **paths relative to the repository root**
(`bash scripts/_pyrun.sh scripts/log_hook.py ...`). Opened in a subdirectory, the tool
cannot find `.claude/` or `.cursor/` → **no hook runs → nothing is logged, and no error is
reported**. Someone can push for a week and score zero on AI logs.

---

## Product

**Medication Safety Copilot** — an AI agent that looks up **drug–drug** and **drug–food**
interactions *with cited sources*, set inside the "Health System X" web app.

The agent acts as a **reference safety warning**: it shows the verbatim quote, its source
and the review status. It **does not draw clinical conclusions and does not replace a
doctor's judgement.**

Full detail: [gate/gate_1/README.md](gate/gate_1/README.md) (Brief + PRD + UI flow).

### The three rules that never bend

1. **Never invent a warning.** Every warning **must** be backed by a verbatim quote from
   the original PDF leaflet plus a link to the source. No citation means no warning —
   return "no data available". Never let the model infer an interaction on its own.
2. **Never draw clinical conclusions.** No diagnosis, no suggestion to switch medicines, no
   dosing. Everything the system produces is reference information.
3. **Human-in-the-loop must not block the flow.** Every warning (including severe and
   major) is shown to the patient **immediately**, labelled *"awaiting professional
   confirmation"*. Pharmacists review in parallel. **Do not** implement a full-gate model
   that withholds unapproved warnings.

### Out of scope — do not add these on your own initiative

Diagnosis or prescribing · the AI changing medicines by itself · drug–condition
interactions · long-term memory · cloning the UI or real data of the reference hospital.

---

## Team

| Name | Role |
|---|---|
| Lê Nguyễn Minh Quang | PM / PO / Tech Lead / Dev |
| Nguyễn Thanh Hùng | Backend + Database |
| Đỗ Quý Đức | Frontend + Backend |
| Lê Nhật Minh | Frontend |

Team: **Cuvée Tech** · Project code: **P-054**

---

## Repository structure

### ★ This repository is a WORKSPACE, not just a place to keep code

The whole project context lives in the repository: specification, architecture decisions,
planning. The team and AI tools read **the same source**, and every change is versioned
and reviewable.

| Directory | Contents | Answers |
|---|---|---|
| [`specs/`](specs/) | Product and domain specification | **What** to build, and **why** |
| [`adrs/`](adrs/) | Architecture Decision Records | **How** to build it, and **why that way** |
| [`planning/`](planning/) | Backlog, sprints, open questions | **When**, and **what is blocked** |
| [`docs/`](docs/) | Backend and frontend guides, architecture | **How to work on the code** |

`backend/` and `frontend/` hold **source only**. Their documentation lives in `docs/`, so
all project context sits outside the codebase.

### Reading order before starting work

1. [`specs/product-vision.md`](specs/product-vision.md) — **the three rules that never bend**
2. [`specs/domains.md`](specs/domains.md) — shared vocabulary and **the RAG boundary**
3. [`adrs/README.md`](adrs/README.md) — skim the index; read
   [ADR 0004](adrs/0004-drug-drug-lookup-not-similarity.md) closely if you are touching the
   warning path
4. [`planning/backlog.md`](planning/backlog.md) — what is left, and what is blocked
5. The rest of this file — coding conventions
6. Right before writing code: [`docs/code-style.md`](docs/code-style.md), then
   [`docs/backend.md`](docs/backend.md) or [`docs/frontend.md`](docs/frontend.md)

**If you are touching the warning path, ADRs 0004, 0005 and 0006 are required reading.**
They are product constraints, not engineering suggestions.

### Update rule

Product behaviour changes → update `specs/` **in the same pull request** as the code.
A hard-to-reverse decision → write a new ADR; **never rewrite an old one** (mark it
`Superseded`). Documentation that has drifted from the code is worse than none, because
people still believe it.

### Layout

The backend follows a **RAG-pipeline layout** — one directory per stage:

```
P-054/
├── specs/              ★ product-vision · domains · user-roles · features · api-contracts
├── adrs/               ★ architecture decisions, numbered upward, never rewritten
├── planning/           backlog.md + sprints/
├── docs/               backend.md · frontend.md · architecture_diagram.md · guide/
├── gate/gate_1/        ★ SUBMITTED — NEVER EDIT, DELETE OR RENAME
├── backend/            ★ source only — no .md files live here
│   ├── config.yaml     RAG parameters (chunk size, top_k, model) — NO secrets
│   ├── logs/           log files (gitignored)
│   └── src/medsafe/
│       ├── ingestion/    loader.py · pipeline.py · cli.py — read CSV/JSON/PDF, batch
│       ├── chunking/     chunker.py — split leaflets, KEEP TEXT VERBATIM
│       ├── embeddings/   embedder.py
│       ├── vectordb/     vector_store.py — ChromaDB
│       ├── retrieval/    retriever.py
│       ├── prompts/      prompt_templates.py — every prompt here, none inline
│       ├── llm/          llm_client.py — the ONE door to the model
│       ├── api/          routes.py + v1/ — THIN routes
│       ├── utils/        helpers.py
│       ├── domain/       ★ PURE logic — no fastapi/sqlalchemy/openai imports
│       ├── db/           models/ + repositories/
│       ├── agents/       LangGraph
│       └── schemas/      Pydantic I/O → generates openapi.json
├── backend/tests/      unit/domain · unit/agents · unit/retrieval · integration/api
├── frontend/           ★ source only — no .md files live here
│   └── src/            Next.js App Router + TS + Tailwind + shadcn
├── dataset/            ★ KEEP THIS NAME (.gitignore ignores `data/`)
├── eval/               deliverable #10
├── presentation/  scripts/  .ai-log/
└── .env  .venv/        ★ MUST live at the root
```

> The reference workspace layout uses a single `/src` directory for code. This is a
> two-language monorepo with two toolchains (uv and Yarn), so `backend/` and `frontend/`
> stay separate — full reasoning in [ADR 0003](adrs/0003-folder-structure.md).

### ★ The RAG boundary — the thing most likely to go wrong

The role of similarity search **differs by interaction type**. Do not apply one rule to
both.

| Question | Mechanism | Why |
|---|---|---|
| Drug–drug: is there an interaction, and how severe? | `db/repositories/` + `domain/` — **table lookup** | `drugtodrug.json` is a relation (A,B)→record. An exact-key lookup is correct by definition |
| **Drug–food: is there an interaction?** | **`retrieval/`** — semantic search | No lookup table exists; the information sits in free text inside the leaflet |
| The verbatim supporting quote | `retrieval/` | |
| Drug information Q&A | `retrieval/` + `prompts/DRUG_INFO_QA` | |
| User mistypes a drug name | `domain/normalization.py` (fuzzy match) | For Vietnamese proper nouns, rapidfuzz + diacritic stripping beats embeddings |

**Only for drug–drug** is similarity search forbidden as the basis for a conclusion. The
concrete reason: a query for *"Warfarin + Tamoxifen"* can return the record for
*"Acenocoumarol + Tamoxifen"* (same coumarin class, very close in embedding space) → a
warning **with a source and a real quote, but naming the wrong pair of drugs**. That
failure passes every "does it have a source?" check.

Drug–food is the opposite: retrieval **is** the detection mechanism, because there is no
table to consult. The constraint there is that the output must be a verbatim quote, not a
sentence the model composed.

Below `retrieval.score_threshold` → return empty → the layer above reports **"no data
available"**. Never lower the threshold just to return something.

### Where code goes

| Concern | Location |
|---|---|
| A new endpoint | `api/v1/` |
| Pure logic (name normalisation, severity ranking, pairing) | `domain/` |
| Database queries | `db/repositories/` — **never** write a query inside a route |
| Prompts | `prompts/prompt_templates.py` — never inline inside a node |
| Calling the LLM | `llm/llm_client.py` — never call the OpenAI SDK anywhere else |
| Agent nodes and tools | `agents/` |
| Batch or one-off jobs | `ingestion/` |
| Tunable parameters (chunk size, top_k, model) | `backend/config.yaml`, never hardcoded |
| API request/response types | `schemas/` |

---

## Data

- `dataset/drug_list_bv_gtvt.csv` — hospital medicine catalogue, ~1073 rows, **column names
  are Vietnamese without diacritics**. Key columns: `Biet duoc`, `Hoat chat - Ham luong`,
  `Link HDSD 1`.
- `dataset/drugtodrug.json` — known interaction pairs: `Hoạt chất 1`, `Hoạt chất 2`,
  `Cơ chế`, `Hậu quả`, `Xử trí` (Vietnamese **with diacritics**).

Note: CSV column names have **no diacritics** while the JSON content **does** — every
comparison must go through `domain/normalization.py`, never raw string equality.

Do not commit large data files. `data/` is gitignored; `dataset/` is not — do not rename
`dataset/` to `data/`, or the data drops out of git.

---

## Coding conventions

### Python
- Python 3.11 · ruff line-length **120** · select `E,F,I,N,W,UP`
- **Type hints are required** on every public function (a Code Quality grading criterion)
- **No bare `except:`** — catch specific exceptions, or use the central handler in
  `api/errors.py`
- Pydantic v2 (`model_config = SettingsConfigDict(...)`, not `class Config`)
- Absolute imports: `from medsafe.domain.severity import ...`
- Async for all I/O on the request path

> Full per-library rules and naming conventions: [`docs/code-style.md`](docs/code-style.md).
> One rule worth repeating here: **components never call `services/*` directly — always go
> through a React Query hook in `queries/*`.**

### Frontend
- Strict TypeScript · App Router · Tailwind · shadcn/ui
- **`src/lib/api/types.gen.ts` is GENERATED** from `openapi.json` — never edit it by hand
- Dark mode and responsiveness are **grading criteria**, not nice-to-haves

### Documentation
- **Every `.md` file in this repository is written in English**, including specs, ADRs,
  planning and READMEs — even though the team speaks Vietnamese day to day.
- Exceptions: `gate/` (already submitted) and `docs/guide/` (the programme's own
  material). Do not translate or edit either.
- **No `.md` files inside `backend/` or `frontend/`.** Documentation for those goes in
  `docs/backend.md` and `docs/frontend.md`, so context stays outside the source tree.

### Git
- **Commit messages in English**, following Conventional Commits
  (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`).
- Never commit `.env`. Never `git push --no-verify` (it skips the AI-log submission).

### Tests
- `backend/tests/unit/domain/` must run with **no LLM, no database and no network**. This
  is where drug-name normalisation accuracy is measured for `eval/`.
- Mock the LLM through the `mock_llm` fixture in `conftest.py`; never call OpenAI for real
  in a test.

---

## AI usage logging — AUTOMATIC, do not touch

Logging is fully automated through hooks and a pre-push hook.

**Do not:**
- ❌ Manually run `scripts/log_hook.py`, `scripts/log_antigravity.py`, `scripts/submit_log.py`
- ❌ Edit or delete anything in `.ai-log/`
- ❌ Change anything under `scripts/`
- ❌ Bypass the hook with `git push --no-verify`

If the pre-push hook fails → **tell the user**, never bypass it.
Details: [.agents/rules/ai-log-hook.md](.agents/rules/ai-log-hook.md) ·
[AI_LOGGING_SETUP.md](AI_LOGGING_SETUP.md)

Using a web tool with no hook (ChatGPT, Claude.ai, Gemini Web) → log it manually following
[.agents/workflows/log.md](.agents/workflows/log.md).

---

## Graded deliverables

Do not let these go stale — they carry marks:

| File | Cadence |
|---|---|
| [WORKLOG.md](WORKLOG.md) | **daily** — use `/worklog` |
| [JOURNAL.md](JOURNAL.md) | **weekly** — use `/journal` |
| [docs/architecture_diagram.md](docs/architecture_diagram.md) | whenever the architecture changes |
| [eval/results/report.md](eval/results/report.md) | whenever there are new measurements |
| [README.md](README.md) | Problem → Solution → Tech Stack → Setup → Team |

Full checklist: [docs/guide/deliverables/checklist.md](docs/guide/deliverables/checklist.md)

**`gate/gate_1/` has been submitted — never edit, delete, rename or move it.**
