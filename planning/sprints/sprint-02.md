# Sprint 02 — Core flow

- **PRD milestone:** M2 Core flow (end of week 3)
- **Status:** 🔄 In progress
- **Started:** 2026-08-03

> This is a **proposal** drafted from the backlog, not the output of a team planning
> session. Quang confirms scope and owners before treating it as a commitment.

## Sprint goal

Get **one real flow** working end to end: enter two medicines, see a warning on screen
with a real citation. Coverage limited to the 50-medicine pilot is acceptable.

Definition of success: open `/interactions`, enter Warfarin and Aspirin, and see a warning
with a verbatim quote taken from a real PDF leaflet.

## Decide first, build second

| | Question | Owner | Blocks |
|---|---|---|---|
| Q1 | API envelope | Hùng + Đức | B-06, B-09 — all API wiring |
| Q3 | Vision model for PDF extraction | Quang + Hùng | B-01 — ingestion |

**Settle Q1 and Q3 in the first two days.** Until they are answered, half the sprint
cannot start.

## Commitments

| Ticket | Work | Owner | Backlog |
|---|---|---|---|
| VMEC-37 | Workspace restructure (specs / adrs / planning) | Quang | — |
| — | `domain/normalization.py` + unit tests | Hùng | B-02 |
| — | `domain/pairing.py` and `domain/severity.py` | Hùng | B-03, B-04 |
| — | Ingestion pilot, 50 medicines | Đức | B-01 |
| — | Repository lookup over `drugtodrug.json` | Hùng | B-05 |
| — | `POST /interactions/check` | Đức | B-06 |
| — | Wire the frontend to the check endpoint | Minh | B-09 |
| — | WORKLOG and JOURNAL for this week | Quang | B-13 |

## Acceptance criteria for the two riskiest items

### B-02 · Drug-name normalisation

- [ ] `normalize("panadol")` returns an ingredient containing paracetamol
- [ ] `normalize("Paracetamol")` and `normalize("paracetamol")` agree
- [ ] An unaccented query finds the accented entry (`"amoxicilin"` → `"Amoxicilin"`)
- [ ] An unknown name returns empty with a below-threshold score — it **must not** guess the
      nearest medicine
- [ ] At least 30 test cases (user input → expected result), producing an accuracy figure
- [ ] Tests under `backend/tests/unit/domain/` run with **no LLM, no database, no network**
- [ ] `domain/normalization.py` imports no `fastapi`, `sqlalchemy` or `openai`

Where confidence is low, **ask the user** rather than silently picking the closest match:
a wrong name means the wrong pair, which means the wrong warning.

### B-06 · `POST /interactions/check`

- [ ] Accepts `{ drugIds, foods? }`, returns `{ items, notFound }`
- [ ] N medicines produce exactly **C(N,2)** pairs
- [ ] Every item carries a non-empty `citations` array; items without one are not returned
- [ ] Pairs with no data go into `notFound`, **not** into `items` with `severity: unknown`
- [ ] Lookup is by **exact key**, never vector search
- [ ] Regression test: *Warfarin + Tamoxifen* **must not** return the
      *Acenocoumarol + Tamoxifen* record
- [ ] Returns `pending` items too — **do not** filter by review status
- [ ] Async throughout; no bare `except:`
- [ ] Run the `citation-auditor` subagent before opening the pull request

Constraints that apply: [ADR 0004](../../adrs/0004-drug-drug-lookup-not-similarity.md),
[ADR 0005](../../adrs/0005-human-in-the-loop-non-blocking.md),
[ADR 0006](../../adrs/0006-citation-required-for-every-warning.md).

## Out of scope this sprint

Real authentication (the frontend uses a stub session to wire the API first) · OCR ·
review queue · deployment.

## Risks

| Risk | Mitigation |
|---|---|
| The 50-medicine pilot yields poor coverage | Measure it in the first two days. Below 30%, change the extraction approach rather than processing all 1073 |
| Q1 is answered late | Minh builds the UI against mocks shaped exactly like `specs/api-contracts.md` |
| Vietnamese drug names match incorrectly | B-02 has its own tests and reports accuracy immediately, not at the end |
