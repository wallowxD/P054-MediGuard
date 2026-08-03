# ADR 0001 — Three-tier architecture with a RAG-pipeline layout

- **Status:** Accepted
- **Date:** 2026-08-02
- **Commit:** `865a438 refactor: restructure backend as uv workspace with RAG layout`

## Context

The starter template put Python code under `src/` with an `agents/ api/ models/ services/`
layout. Our product is a **multi-step RAG pipeline** (ingest → chunk → embed → store →
retrieve → answer), not a CRUD app.

With the template layout every pipeline stage ends up inside `services/` — one directory
that grows until it holds a pile of unrelated things.

## Decision

**Each stage of the RAG pipeline gets its own directory**, and pure business logic is
separated into `domain/`.

```
backend/src/medsafe/
├── ingestion/    loader · pipeline · cli — read CSV/JSON/PDF, runs as a BATCH job
├── chunking/     split leaflets, KEEP TEXT VERBATIM + source coordinates
├── embeddings/   text → vector
├── vectordb/     ChromaDB
├── retrieval/    fetch supporting passages
├── prompts/      EVERY prompt lives here
├── llm/          the ONE door to the model
├── api/          THIN routes
├── domain/       ★ PURE logic
├── db/           models + repositories
├── agents/       LangGraph
└── schemas/      Pydantic I/O → generates openapi.json
```

### The constraint that matters most: `domain/` imports no framework

`domain/` **must not import** `fastapi`, `sqlalchemy` or `openai`. Plain Python only.

The reason is not aesthetic. `backend/tests/unit/domain/` has to run **without an LLM,
without a database and without network access**, because that is where
*drug-name normalisation accuracy* — one of the PRD's success metrics — is measured. If
`normalization.py` were to import `openai`, that measurement would depend on the network
and stop being reproducible.

### Single doors

| Concern | The only place for it |
|---|---|
| Calling the LLM | `llm/llm_client.py` |
| Writing prompts | `prompts/prompt_templates.py` |
| Database queries | `db/repositories/` |
| Tunable parameters (chunk size, top_k, model) | `backend/config.yaml` |

Prompts scattered through node code and SDK calls made from anywhere are the two things
that make it impossible to know what the model is actually being asked.

## Consequences

✅ Each pipeline stage can be replaced independently (swapping ChromaDB for Qdrant touches
only `vectordb/`)
✅ Domain tests are fast, deterministic, and run on CI without secrets
✅ The directory names describe how the pipeline works

❌ More directories than the template, so newcomers spend longer finding things
❌ It takes discipline: writing a query straight into a route is always the easier move

## Alternatives considered

- **Keep the template layout** — rejected; `services/` becomes a dumping ground
- **Vertical feature slices** — rejected; the RAG stages share too much, so slicing
  vertically would duplicate them
