# ADR 0006 — No citation, no warning

- **Status:** Accepted
- **Date:** GATE 1 (rule 1 in the submitted PRD)

## Context

A language model will happily make statements about drug interactions whenever asked, in a
confident tone. In a medical product, an invented warning is more dangerous than no
warning at all.

## Decision

Every warning **must** be backed by at least one `Citation` — a **verbatim** quote from the
original PDF leaflet, plus its source.

No citation → **the warning is not shown** → return *"no data available"*.

The model is **never** used to *generate* an interaction. Its role is limited to explaining
retrieved content in plain language and answering questions from passages already
retrieved.

## Enforcement at each layer

| Layer | How |
|---|---|
| Chunking | `chunking/chunker.py` keeps text **verbatim** with source coordinates. No paraphrasing at storage time |
| Retrieval | Below `score_threshold` → return empty; never lower the threshold |
| Schema | `citations` cannot be empty in `IInteractionItem` |
| UI | `InteractionCard` and `InteractionTableRow` **return null** when `citations` is empty |
| UI | `CitationBlock` renders `quote` verbatim — no summarising, no `line-clamp` |
| Review | Pharmacists can verify because `sourceUrl` and `page` are present |
| CI | The `citation-auditor` subagent reviews every warning-producing code path |

## Why block in the UI as well

Blocking in the backend is logically sufficient. But the UI check costs one line and
catches the cases that matter: a schema change that drops the constraint, or older rows in
the database that predate it.

A warning without a source is worse than no warning, so when the citation is missing the
right move is **not to render it at all**. The calling layer is responsible for counting
those and telling the user "no data available".

## Consequences

✅ Every warning can be traced back to the original PDF
✅ Pharmacist review is fast because the source and page number are already there

❌ Lower coverage: a real interaction that has not been extracted yet produces silence.
This is a deliberate trade-off, and the reason **extraction coverage** must be measured
during the pilot
❌ The model cannot be used to fill gaps — even when it would be right
