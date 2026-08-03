# ADR 0009 — Adopt a single coding style, and where it is written down

- **Status:** Accepted
- **Date:** 2026-08-03
- **The conventions themselves:** [`docs/code-style.md`](../docs/code-style.md)

## Context

Four people and several AI tools write into this repository. Without an agreed style, each
of them picks a reasonable-looking answer to the same question — one fetches data with
`useEffect`, another with React Query; one puts API results in Redux, another leaves them
in the cache. Every split doubles the number of patterns a reviewer must hold in their
head, and the resulting bugs are the quiet kind.

A second question came with it: **where** should conventions live? They have two halves
that behave differently. "We chose React Query over hand-rolled fetching, and here is what
we rejected" is a decision made once. "Component files are `PascalCase.tsx`" is a catalogue
entry that grows every time someone adds a library.

## Decision

**1. There is one style for the whole repository**, not one per developer. A diff should
not reveal who wrote it.

**2. The style is split across two files, by how often each part changes:**

| | Where | Nature |
|---|---|---|
| Why we chose a tool, what we rejected | **this ADR** | Written once, never rewritten. Superseded if we change our mind |
| The catalogue: naming tables, which library for which job, code snippets | [`docs/code-style.md`](../docs/code-style.md) | Living document, edited whenever a convention is added |

**No fact appears in both files.** This ADR carries no naming table and no library table —
it states decisions in prose and points to the guide for the list. When you add a
convention, you edit the guide. When you *change* a decision, you write a new ADR.

**3. The decisions themselves**, in short: React Query owns server state; Redux Toolkit
owns client state; a single axios instance owns HTTP transport; react-hook-form owns
forms; react-toastify owns user feedback; Tailwind theme tokens own colour. Components
reach data only through `queries/*`. API responses never enter Redux. On the backend,
`domain/` imports no framework, prompts live only in `prompts/`, model calls only in
`llm/`, SQL only in `db/repositories/`.

## Why

**Why one style at all** — the cost of two patterns is not merely two patterns; it is every
reader having to work out which one applies before they can read the code.

**Why React Query owns server state** — the alternative is re-implementing caching,
deduplication, `isLoading` and invalidation by hand in each component, inconsistently. The
rule "components never import `services/*` directly" exists because breaking it fails
*silently*: the data still arrives, so nothing looks wrong until two screens disagree about
what the server said.

**Why API data never enters Redux** — two stores holding the same value drift apart, and
the drift surfaces as a stale warning on screen. In a medical product, a stale interaction
warning is precisely the failure we cannot ship.

**Why one axios instance** — the refresh-token logic (single-flight, cooldown, sign-out on
failure) lives in one interceptor. A second HTTP path would bypass it and produce random
401s once tokens expire.

**Why naming conventions matter beyond taste** — when `getInteractionsRequest`,
`useInteractions` and `interactionKeys` are all predictable from the domain name, a
newcomer finds any of the three without searching, and an AI tool generates the matching
name instead of inventing a fourth style.

**Why the catalogue is not in this ADR** — an ADR earns its value by being a historical
record nobody edits. A style catalogue changes every time a library is added. Putting a
living list inside an immutable record would mean rewriting ADRs routinely, and once people
start editing ADRs, none of them can be trusted as a record of what was decided when.

## Consequences

✅ A diff does not reveal who wrote it; review focuses on logic rather than style
✅ New work has an obvious shape, so less time goes into deciding where things belong
✅ AI tools produce code matching the codebase, because the rules are written down
✅ `adrs/` stays append-only and therefore trustworthy

❌ More ceremony for a one-off call: even a single request goes service → query → component
❌ Nothing in CI checks "did you go through `queries/*`", so a violation ships silently
until a reviewer notices
❌ Two files to keep aligned. Mitigated by the no-overlap rule above: if a fact appears in
both, one of them is wrong and should be deleted, not synchronised

## Not decided

The frontend testing framework, the backend logging format, and the Alembic migration
workflow are deliberately left open — listed at the end of
[`docs/code-style.md`](../docs/code-style.md). Do not settle any of them alone; bring it to
the team and record the outcome as a new ADR.
