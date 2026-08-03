# ADRs — Architecture Decision Records

A record of **decisions we made**, with the **reasoning** and the **trade-offs**.

The point is not to show off the architecture. It is so that six months later — or a fresh
AI session — nobody reopens a carefully considered decision simply because no one
remembers why it was made.

## Index

| # | Decision | Status |
|---|---|---|
| [0001](0001-architecture-style.md) | Three-tier architecture with a RAG-pipeline layout | Accepted |
| [0002](0002-tech-stack.md) | Technology stack | Accepted |
| [0003](0003-folder-structure.md) | Workspace directory structure | Accepted |
| [0004](0004-drug-drug-lookup-not-similarity.md) | ★ Drug–drug uses the table, never similarity search | Accepted |
| [0005](0005-human-in-the-loop-non-blocking.md) | Human-in-the-loop must not block the flow | Accepted |
| [0006](0006-citation-required-for-every-warning.md) | No citation, no warning | Accepted |
| [0007](0007-frontend-structure-and-auth.md) | Frontend structure and authorisation | Accepted |
| [0008](0008-toolchain-version-pins.md) | Pinning frontend toolchain versions | Accepted |
| [0009](0009-coding-conventions.md) | Coding conventions and library choices | Accepted |

★ **[0004](0004-drug-drug-lookup-not-similarity.md) matters most.** Breaking it produces
warnings that carry a genuine source but name the wrong pair of drugs — a failure that
passes every other check we have.

## ADR or guide? — where a rule belongs

Conventions have two halves, and they go in different places:

| You are writing | Goes in | Because |
|---|---|---|
| *Why* we chose a tool, and what we rejected | an **ADR** here | Decided once; a historical record |
| The catalogue — naming tables, which library for which job | [`docs/code-style.md`](../docs/code-style.md) | Grows every time a library is added |

**A fact must not appear in both.** If it does, one copy is already wrong — delete it
rather than trying to keep them in step. See [ADR 0009](0009-coding-conventions.md), which
records this split itself.

Rule of thumb: if adding a library would make you edit the file, it is a guide, not an ADR.

## When to write a new ADR

Write one when a decision is **hard to reverse** or when **someone will later ask why**:

- Adopting or rejecting a library or a service
- Moving a boundary between layers
- Accepting a trade-off that looks wrong from the outside
- **Not** doing the conventional thing (say explicitly why not)

Do not write an ADR for things the code already answers (function names, where a single
file lives).

## Rules

- **Numbers only go up**, and are never reused
- **Never delete or rewrite an old decision.** If we change our mind, write a new ADR and
  mark the old one `Superseded by NNNN`. The history of changing our mind is information too
- The **negative consequences** section is mandatory. An ADR with only upsides has not been
  thought through

## Template

```markdown
# ADR NNNN — <Title>

- Status: Proposed | Accepted | Superseded by NNNN
- Date:

## Context
## Decision
## Why
## Consequences   (both ✅ and ❌)
## Alternatives considered
```
