# Features

> Priority levels (HIGH / MEDIUM / LOW) come from the PRD. Status reflects the code
> actually in the repo — cross-check with [`planning/backlog.md`](../planning/backlog.md).

Status: ✅ done · 🔄 in progress · ⬜ not started

---

## HIGH — no MVP without these

### F-01 · Drug–drug interaction lookup ⬜
Take N medicines → generate C(N,2) pairs → **table lookup** in `drugtodrug.json` → return
warnings with mechanism / consequence / management plus the supporting quote.

**No similarity search** for the conclusion step — see
[ADR 0004](../adrs/0004-drug-drug-lookup-not-similarity.md).

### F-02 · Drug–food interaction lookup ⬜
Semantic search over leaflet text. This is where retrieval **is** the detection
mechanism. The output must be a verbatim quote.

### F-03 · Drug-name normalisation ⬜
User types a misspelt or unaccented name → fuzzy match to the active ingredient.
`rapidfuzz` + `unidecode`, inside `domain/normalization.py`.

This is also where **normalisation accuracy** is measured for `eval/`, so its tests must
run with no LLM, no database and no network.

### F-04 · Warnings shown with citations ⬜ (UI ✅)
Every warning carries a verbatim `quote`, its source and a page number. No citation →
**the warning is not rendered**.

Frontend is done: `InteractionCard`, `CitationBlock`, `SeverityBadge`. The backend
endpoint does not exist yet.

### F-05 · Visual severity ⬜ (UI ✅)
Five levels: contraindicated / major / moderate / minor / unknown. The backend assigns
them deterministically; the frontend only colours them.

### F-06 · Non-blocking human-in-the-loop ⬜ (UI ✅)
`pending` warnings are shown **in full**, labelled *"awaiting professional confirmation"*.
Pharmacists review in parallel at `/review`.

### F-07 · Ingestion pipeline ⬜
CSV/JSON → download PDF leaflets → text → chunk (**verbatim** + source coordinates) →
embed → ChromaDB. Runs as a batch job, off the request path.

**Pilot on 50 medicines first** before processing all 1073 — `make ingest-pilot`.

### F-08 · Authentication and authorisation ⬜ (UI ✅)
NextAuth credentials, role inside the JWT, blocking at the edge. The backend has no auth
module yet.

---

## MEDIUM

### F-09 · Prescription OCR ⬜
Upload or photograph a prescription → recognise medicine names → user confirms the list
before the lookup runs. Supports merging several prescriptions into one check.

### F-10 · Drug information Q&A ⬜
Retrieval + `prompts/DRUG_INFO_QA`. Returns directions for use, dosage, contraindications
and side effects.

### F-11 · Pharmacist review queue ⬜ (UI ✅)
List of check requests → inspect sources → approve, edit-then-approve, or reject.

### F-12 · Lookup history ⬜
Save checked prescriptions so users can revisit them.

### F-13 · Landing page ✅
Public marketing page for signed-out visitors, built to the agreed wireframe.

---

## LOW

### F-14 · Dark mode and responsive layout ✅
A **grading criterion**, not a nice-to-have. The CSS tokens already cover both themes;
there is no toggle yet (it follows `prefers-color-scheme`).

### F-15 · Medicine vs. existing condition ⬜ — **scope not settled**
Present in the GATE 1 UI flow, but "drug–condition interactions" is listed under Out of
scope in the PRD. The contradiction is unresolved — see
[`planning/backlog.md`](../planning/backlog.md).

### F-16 · Two-factor authentication ⬜
The modal shell exists; it is not wired to an API and `qrcode.react` is not installed.

---

## Not building

Diagnosis or prescribing · the AI changing medicines by itself · long-term memory · a
full-gate model that withholds unapproved warnings · cloning the UI or real data of the
reference hospital.
