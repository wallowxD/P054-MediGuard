# Backend guide

A RAG agent that looks up **drug–drug** and **drug–food** interactions with cited sources.
Python package: `medsafe` · FastAPI + LangGraph + ChromaDB.

> **Read this before writing any backend code.** The `backend/` directory holds source
> only — all documentation lives here, outside the codebase.

⚠️ Always open the repository at its root, `P-054/` — never `backend/`. The AI logging
hooks use paths relative to the root, and opening the wrong directory silently loses every
log. See [AGENTS.md](../AGENTS.md).

---

## Quick start

Every command runs from the **repository root**, not from `backend/`:

```bash
uv sync                    # creates .venv at the repo root, installs medsafe editable
make run                   # dev API  -> http://localhost:8000/docs
make test                  # pytest backend/tests
make check                 # lint + format + tests (same as CI)
make ingest-pilot          # extract a 50-medicine pilot set, per the PRD
```

Secrets live in `.env` at the **repository root**, not `backend/.env`.
`backend/.env.example` exists only to document variable names.

---

## Structure

```
backend/
├── pyproject.toml          dependencies + ruff/pytest config (package: medsafe)
├── config.yaml             RAG parameters — NO secrets
├── Dockerfile              build context = REPO ROOT (uv.lock lives at the workspace root)
├── .env.example            variable names (real values live at the root)
├── logs/                   log files, gitignored
│
├── src/medsafe/
│   ├── main.py             create_app(), CORS, /health
│   ├── config.py           Settings (reads the root .env) + loads config.yaml
│   │
│   │   ── RAG pipeline, one directory per stage ──
│   ├── ingestion/          load raw data, runs as a BATCH job off the request path
│   │   ├── loader.py       read the drug-list CSV, drugtodrug JSON, download PDF leaflets
│   │   ├── pipeline.py     load → PDF → text → chunk → embed → store
│   │   └── cli.py          python -m medsafe.ingestion.cli --limit 50
│   ├── chunking/chunker.py     split leaflets, KEEP TEXT VERBATIM + source coordinates
│   ├── embeddings/embedder.py  text → vector
│   ├── vectordb/vector_store.py  ChromaDB (Protocol + implementation)
│   ├── retrieval/retriever.py    fetch supporting passages  ★ see the boundary below
│   ├── prompts/prompt_templates.py  EVERY prompt here, never inline
│   ├── llm/llm_client.py       the ONE door to the model
│   │
│   │   ── business logic ──
│   ├── domain/             PURE logic — no fastapi/sqlalchemy/openai imports
│   │   ├── normalization.py    drug name → active ingredient (fuzzy match)
│   │   ├── severity.py         deterministic severity ranking
│   │   └── pairing.py          N medicines → C(N,2) pairs to check
│   ├── db/
│   │   ├── models/         SQLAlchemy: drug, ingredient, interaction, excerpt, review
│   │   └── repositories/   queries — NEVER write a query inside a route
│   ├── agents/             LangGraph: graph, state, nodes/, tools/
│   ├── schemas/            Pydantic I/O → generates openapi.json
│   ├── api/
│   │   ├── routes.py       router aggregation
│   │   └── v1/             interactions · drugs · prescriptions · reviews
│   └── utils/helpers.py    shared helpers (diacritic stripping, Drive links, stable ids)
│
└── tests/
    ├── conftest.py
    ├── unit/domain/        runs with NO LLM, database or network
    ├── unit/agents/
    ├── unit/retrieval/
    └── integration/api/
```

---

## ★ The boundary that matters most

The role of similarity search **differs by interaction type**. Do not apply one rule to
both.

| Question | Mechanism | Why |
|---|---|---|
| Drug–drug: is there an interaction, and how severe? | `db/repositories/` + `domain/` — **table lookup** | `drugtodrug.json` is a relation `(A,B) → record`. An exact-key lookup is correct by definition |
| **Drug–food: is there an interaction?** | **`retrieval/`** — semantic search | No lookup table exists; the information is only in the leaflet's free text |
| The verbatim supporting quote | `retrieval/` | |
| Drug information Q&A | `retrieval/` + `prompts/DRUG_INFO_QA` | |
| User mistypes a drug name | `domain/normalization.py` | For Vietnamese proper nouns, character matching beats embeddings |

**Only for drug–drug** is similarity search forbidden as the basis for a conclusion. The
concrete reason: a query for *"Warfarin + Tamoxifen"* can return the record for
*"Acenocoumarol + Tamoxifen"* — both coumarins, and very close in embedding space. The
result is a warning **with a source and a verbatim quote, but naming the wrong pair of
drugs** — a failure that passes every "does it have a source?" check.

Full decision: [`adrs/0004-drug-drug-lookup-not-similarity.md`](../adrs/0004-drug-drug-lookup-not-similarity.md)

---

## Where code goes

| Concern | Location |
|---|---|
| A new endpoint | `api/v1/` — THIN routes: validate, then call domain/repository |
| Pure logic (normalisation, severity, pairing) | `domain/` |
| Database queries | `db/repositories/` |
| Prompts | `prompts/prompt_templates.py` |
| Calling the LLM | `llm/llm_client.py` |
| Agent nodes and tools | `agents/` |
| Batch or one-off jobs | `ingestion/` |
| Tunable parameters (chunk size, top_k, model) | `config.yaml`, never hardcoded |
| API request/response types | `schemas/` |

---

## Conventions

- Python 3.11 · ruff line-length 120 · **type hints required** · **no bare `except:`**
- Pydantic v2 · absolute imports: `from medsafe.domain... import ...`
- Async for all I/O on the request path
- Commit messages in **English**, following Conventional Commits

### Tests

`tests/unit/domain/` must run with **no LLM, no database and no network**. This is where
*drug-name normalisation accuracy* — a PRD success metric — is measured, and the numbers
flow into [`eval/results/report.md`](../eval/results/report.md).

Mock the LLM through the `mock_llm` fixture in `conftest.py`; never call OpenAI for real in
a test.

---

## Data

- `dataset/drug_list_bv_gtvt.csv` — hospital medicine catalogue, ~1073 rows. Column names
  are Vietnamese **without diacritics**: `Biet duoc`, `Hoat chat - Ham luong`,
  `Link HDSD 1`.
- `dataset/drugtodrug.json` — known interaction pairs: `Hoạt chất 1`, `Hoạt chất 2`,
  `Cơ chế`, `Hậu quả`, `Xử trí` — Vietnamese **with diacritics**.

Because the CSV has no diacritics and the JSON does, **every comparison must go through
`domain/normalization.py`**. Never compare raw strings.
