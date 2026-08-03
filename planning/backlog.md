# Backlog

> Priorities come from [`specs/features.md`](../specs/features.md).
> Sprint commitments live in [`sprints/`](sprints/).
>
> Update this file whenever priorities change or an open question gets settled.

---

## ⚠️ Open questions — settle these before writing more code

These three are either blocking work or will cause rework if answered late.

### Q1 · API envelope — **blocking all frontend API wiring**

Does the backend return `{ error, message, data }` or the payload directly?

The frontend currently assumes **an envelope** (`queries/utils.ts` → `withApiTransform`),
inherited from the boilerplate. FastAPI returns payloads **directly** by default. Deciding
late means editing every hook.

**Owner:** Hùng (backend) + Đức · **Due:** before the first endpoint ships

### Q2 · Are we building "medicine vs. existing condition"?

It is in the UI flow submitted for GATE 1, but "drug–condition interactions" is listed
under **Out of scope** in the PRD. Two submitted documents contradict each other.

**Owner:** Quang (PO) · **Due:** before Sprint 3

### Q3 · Which vision model extracts the PDF leaflets?

Not chosen yet. It drives both cost and extraction coverage in the pilot.

**Owner:** Quang + Hùng · **Due:** before running `ingest-pilot`

---

## Priority 1 — no demo without these

| ID | Work | Depends on | Notes |
|---|---|---|---|
| B-01 | Ingestion pilot, 50 medicines | Q3 | Measure coverage before processing all 1073 |
| B-02 | `domain/normalization.py` + tests | — | No LLM, DB or network. This is the number reported in `eval/` |
| B-03 | `domain/pairing.py` — N medicines → C(N,2) pairs | — | |
| B-04 | `domain/severity.py` — deterministic severity | — | |
| B-05 | Repository lookup over `drugtodrug.json` | B-02 | **Table lookup**, see [ADR 0004](../adrs/0004-drug-drug-lookup-not-similarity.md) |
| B-06 | `POST /interactions/check` | B-03, B-05, Q1 | Must return `notFound` |
| B-07 | Drug–food retrieval | B-01 | Respect `score_threshold`; never lower it |
| B-08 | Auth module with roles in the JWT | Q1 | The frontend is ready to connect |
| B-09 | Wire the frontend to real endpoints | B-06, B-08 | Replace the `apiNotReady()` stubs, following their TODOs |

## Priority 2 — needed for a complete submission

| ID | Work | Notes |
|---|---|---|
| B-10 | Review queue with approve/reject | UI is done, the API is missing |
| B-11 | Real numbers in `eval/results/report.md` | Deliverable #10 |
| B-12 | Keep `docs/architecture_diagram.md` in step with the code | Deliverable #3 |
| B-13 | **WORKLOG.md and JOURNAL.md** | Deliverables #8 and #9 — **still empty templates, currently losing marks** |
| B-14 | Prescription OCR | MEDIUM feature |
| B-15 | Drug information Q&A | |
| B-16 | Deploy and publish a live URL | Deliverable #5 |

## Priority 3 — polish

| ID | Work |
|---|---|
| B-17 | Dark-mode toggle (the CSS already supports both themes) |
| B-18 | Lookup history |
| B-19 | Two-factor authentication (the modal shell exists) |
| B-20 | Use the real images in `public/images/` on the landing page instead of the markup illustration |

## Technical debt

| ID | Item | Why it matters |
|---|---|---|
| D-03 | The `IApiResponse` envelope in `types/backend.d.ts` is unconfirmed | Depends on Q1 |
| D-04 | No CI running `make check` and `make web-lint` | |
| D-05 | Move to TS 7 / ESLint 10 once upstream supports them | See [ADR 0008](../adrs/0008-toolchain-version-pins.md) |
