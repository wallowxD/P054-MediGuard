# Docs — guides and reference

How to work on the codebase. **What** and **why** live in [`specs/`](../specs/); design
decisions live in [`adrs/`](../adrs/); schedule lives in [`planning/`](../planning/).

`backend/` and `frontend/` contain source code only — their documentation lives here, so
all project context sits in one place outside the codebase.

| File | Contents |
|---|---|
| [code-style.md](code-style.md) | **Which library for which job, and how to name things** — read this first |
| [backend.md](backend.md) | Backend structure, conventions, where code goes, how to run it |
| [frontend.md](frontend.md) | Frontend structure, Yarn 4 rules, Next 16 gotchas, non-obvious decisions |
| [architecture_diagram.md](architecture_diagram.md) | System diagram and data flow (graded deliverable #3) |
| [runbook.md](runbook.md) | How to run things, and what to do when they break |
| [guide/](guide/) | The AI20K Technical Guidebook, supplied by the programme — reference material, not ours to edit |

## Editing these files

`docs/` is where **living** documentation goes — anything you would update when a library,
a command or a procedure changes. Decisions and their rationale go in
[`adrs/`](../adrs/) instead, and are never rewritten.

So: a new naming rule → [code-style.md](code-style.md). Changing *which* library we use for
something → a new ADR, then update the guide to match.

## Before you touch code

- Any code at all → read [code-style.md](code-style.md)
- Backend work → also read [backend.md](backend.md)
- Frontend work → also read [frontend.md](frontend.md)
- Anything on the warning path → also read
  [ADR 0004](../adrs/0004-drug-drug-lookup-not-similarity.md),
  [0005](../adrs/0005-human-in-the-loop-non-blocking.md) and
  [0006](../adrs/0006-citation-required-for-every-warning.md)
