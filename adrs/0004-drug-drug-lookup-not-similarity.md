# ADR 0004 — Drug–drug lookups use the table, never similarity search

- **Status:** Accepted
- **Date:** 2026-08-02
- **Importance:** ★ The most important ADR here. Breaking it breaks the product.

## Context

This is a RAG project, so the instinct is to route every question through vector search.
For drug–drug interactions that instinct is **wrong and dangerous**.

## Decision

The role of similarity search **depends on the interaction type**:

| Question | Mechanism | Why |
|---|---|---|
| Drug–drug: is there an interaction, and how severe? | `db/repositories/` + `domain/` — **table lookup** | `drugtodrug.json` is a relation (A,B)→record. An exact-key lookup is correct by definition |
| Drug–food: is there an interaction? | **`retrieval/`** | No lookup table exists; the information is in free text |
| The verbatim supporting quote | `retrieval/` | |
| Drug information Q&A | `retrieval/` + `prompts/DRUG_INFO_QA` | |
| User mistypes a drug name | `domain/normalization.py` (fuzzy match) | |

## Why — concretely, not in the abstract

A query for **"Warfarin + Tamoxifen"** can return the record for
**"Acenocoumarol + Tamoxifen"**.

Warfarin and acenocoumarol are both coumarins; their mechanism descriptions read almost
identically, so they sit very close together in embedding space. Vector search will return
that record with a high similarity score.

The result is a warning **that has a source and a real verbatim quote but names the wrong
pair of drugs**.

That is what makes this failure worse than ordinary hallucination: it **passes every
"does this have a source?" check**. A reviewer sees a genuine quote and a genuine source
and believes it. Only reading the ingredient names closely reveals the problem.

Drug–food is the reverse: retrieval **is** the detection mechanism, because there is no
table to consult. The constraint there is that the output must be a verbatim quote, not a
sentence the model composed.

## Threshold

Below `retrieval.score_threshold` (declared in `backend/config.yaml`) → return empty → the
layer above reports **"no data available"**.

**Never lower the threshold to make something come back.** An honest "no data available"
beats a warning about the wrong pair of drugs.

## How this is checked

- `backend/tests/unit/domain/` — pair-lookup tests must be deterministic and offline
- The `citation-auditor` subagent reviews every code path that produces a warning
- Required regression test: a query for *Warfarin + Tamoxifen* **must not** return the
  acenocoumarol record

## Consequences

✅ Drug–drug warnings are exactly as correct as the underlying data — a wrong answer can
only come from wrong source data, never from the system inferring something

❌ A pair missing from `drugtodrug.json` returns "no data available" even if an interaction
exists in reality. This is a **deliberate trade-off**: missing beats wrong
❌ Two separate code paths to maintain, one per interaction type
