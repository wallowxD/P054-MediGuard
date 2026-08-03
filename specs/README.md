# Specs — product and domain specification

**What** we are building and **why**. Not how (that is [`adrs/`](../adrs/)) and not when
(that is [`planning/`](../planning/)).

| File | Contents | Read it when |
|---|---|---|
| [product-vision.md](product-vision.md) | Problem, users, positioning, **the three rules that never bend** | Day one. Read this before anything else |
| [domains.md](domains.md) | Entities, shared vocabulary, **the RAG boundary** | Before naming a variable or designing a table |
| [user-roles.md](user-roles.md) | Two roles, three access tiers, permission matrix | When touching auth or adding a route |
| [features.md](features.md) | Features by priority, with status | When picking up work |
| [api-contracts.md](api-contracts.md) | The contract between backend and frontend | When writing an endpoint or calling an API |

## Sources of truth

The Brief and PRD submitted for GATE 1 live in [`gate/gate_1/`](../gate/gate_1/) as
`.docx` files and **must not be edited**. This directory is the readable version, plus
anything decided after submission.

Where the two disagree, `gate/gate_1/` is the official submission — but record the
contradiction in [`planning/backlog.md`](../planning/backlog.md) so it gets resolved
rather than quietly ignored.

For **API contracts**, once an endpoint is implemented,
`backend/src/medsafe/schemas/` becomes the source of truth (it generates `openapi.json`,
which generates `frontend/src/lib/api/types.gen.ts`).

## Update rule

If product behaviour changes, update `specs/` **in the same pull request** as the code.
Documentation that has drifted from the code is worse than no documentation, because
people still believe it.
