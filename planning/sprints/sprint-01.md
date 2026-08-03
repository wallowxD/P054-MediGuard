# Sprint 01 — Foundation

- **PRD milestone:** M1 Foundation (end of week 2)
- **Status:** ✅ Complete
- **Source:** reconstructed from git history (`git log main`), not written at the time

> ⚠️ This sprint was written **retrospectively**, after the work was finished, so there is
> no up-front commitment section. From Sprint 02 onwards, sprints are written before the
> work starts.

## Goal

Enough foundation for all four people to work in parallel without colliding.

## Completed

| Ticket | Work | Commit |
|---|---|---|
| — | Initialise from the AI20K template, set up AI logging for the team | `9c82763`, `52f0bd9`, `3856a37` |
| — | Load the dataset (`drug_list_bv_gtvt.csv`, `drugtodrug.json`) | `e7856b4` |
| VMEC-7 | Complete the GATE 1 checkpoint (Brief, PRD, UI flow, repo) | `19e3449` |
| VMEC-15 | Restructure the backend as a uv workspace with the RAG layout | `865a438` |
| VMEC-15 | `AGENTS.md` — shared context for every AI tool | `0fe40ba` |
| VMEC-15 | Restructure plan (now folded into ADR 0003) | `b7be916` |
| VMEC-20 | Rewrite the backend and root READMEs | `cc52f9e`, `d2768a0` |
| VMEC-16 | Scaffold the Next.js 16 frontend with a role-aware structure | `0ce2bb0` |

## Outcome

- GATE 1 submitted ✅
- Backend runs: `make run` → `/health`, `/api/v1/status`
- Frontend runs: `make web` → landing page, three access tiers
- `make dev` runs both together
- `make up` brings up the whole stack in Docker (Postgres + backend + frontend)

## What we learned

- **Opening the repository in the wrong directory silently loses every AI log.** This is
  now the first warning in `AGENTS.md` and in every README.
- The latest release is not always usable: both TS 7 and ESLint 10 break with Next 16. You
  have to install and try before concluding — see
  [ADR 0008](../../adrs/0008-toolchain-version-pins.md).
- A bug sat silently in `backend/Dockerfile`: uv installs workspace members in editable
  mode, the runtime stage never copied the source, and the container died with
  `ModuleNotFoundError: medsafe`. It only surfaced when someone actually ran `make up`.

## Carried into the next sprint

- WORKLOG.md and JOURNAL.md are still empty templates — **currently losing marks on
  deliverables #8 and #9**
- `docs/architecture_diagram.md` does not reflect the real architecture
- Nobody has answered Q1/Q2/Q3 in [`backlog.md`](../backlog.md)
