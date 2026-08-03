# Code style — one style for the whole team

Which library to use for what, and how to name things. The goal is that a diff should not
reveal who wrote it.

Everything below is **already true of the code in the repository** — this file documents
the existing style, it does not propose a new one. If you find code that disagrees, the
code is wrong.

The decisions behind these rules — and why each alternative was rejected — are recorded in
[ADR 0009](../adrs/0009-coding-conventions.md). Structural rules live in
[ADR 0001](../adrs/0001-architecture-style.md) (backend) and
[ADR 0007](../adrs/0007-frontend-structure-and-auth.md) (frontend). This file is the layer
below: day-to-day choices.

---

## Naming

| Thing | Convention | Example |
|---|---|---|
| Directory | `kebab-case` | `components/interactions/`, `store/reducers/` |
| React component | `PascalCase.tsx` | `InteractionCard.tsx`, `EmptyState.tsx` |
| Header / provider | `dot.case.tsx` | `app.header.tsx`, `query.provider.tsx` |
| Config / util file | `kebab-case.ts` | `seo-config.ts`, `metadata-utils.ts` |
| Service function | `<verb><Noun>Request` | `getInteractionsRequest`, `checkInteractionsRequest` |
| Query hook | `use<Noun>` / `use<Verb><Noun>` | `useInteractions`, `useCheckInteractions` |
| Query key factory | `<domain>Keys` | `interactionKeys`, `authKeys` |
| TypeScript interface | prefix `I` | `IInteractionItem`, `ICitation` |
| Type alias (union) | prefix `T` | `TSeverity`, `TReviewStatus` |
| Constant | `SCREAMING_SNAKE_CASE` | `API_ENDPOINTS`, `PUBLIC_ROUTES` |
| Python module | `snake_case.py` | `normalization.py`, `vector_store.py` |
| Python class | `PascalCase` | `VectorStore`, `Settings` |

Pick **one** convention per kind and keep it repo-wide. Never let `InteractionCard.tsx`
live next to `interaction.card.tsx`.

---

## Frontend — which tool for which job

This is the part that most often drifts between developers. There is exactly one right
answer per row.

| Need | Use | Never use |
|---|---|---|
| Data from the API | **React Query** hook in `queries/*` | `useEffect` + `fetch`, or calling `services/*` from a component |
| HTTP call itself | `services/<domain>/index.ts` → `utils/request.ts` | `axios` or `fetch` imported anywhere else |
| Shared UI state (filters, selection) | **Redux Toolkit** slice in `store/` | React Query, or prop-drilling five levels |
| State used by one component | `useState` local to it | A Redux slice |
| Form state and validation | **react-hook-form** | Manual `useState` per field |
| User feedback after an action | **react-toastify** (`toast.success` / `toast.error`) | `alert()`, or a bespoke banner component |
| Icons | **lucide-react** | Inline SVG paste, another icon pack |
| Styling | **Tailwind v4** utilities + theme tokens | Inline `style={{}}`, CSS modules, hardcoded hex |
| Colour | A theme token (`bg-primary`, `text-foreground-muted`) | `#0d9488`, `bg-teal-600` |

### The rule people break most often

```ts
// ❌ never
import { getInteractionsRequest } from "@/services/interactions";
const data = await getInteractionsRequest(params);

// ✅ always
import { useInteractions } from "@/queries/interactions";
const { data, isLoading } = useInteractions(params);
```

Going straight to `services/*` loses caching, `isLoading`, and invalidation — and nothing
fails loudly, so the bug ships.

### API data never enters Redux

React Query owns server state; Redux owns client state. Copying a response into a slice
creates two sources of truth that drift apart silently. If you need API data in several
places, call the same hook in both — React Query deduplicates it.

### Query keys are hierarchical

```ts
export const interactionKeys = {
  all: ["interactions"] as const,
  lists: () => [...interactionKeys.all, "list"] as const,
  list: (params) => [...interactionKeys.lists(), params] as const,
  detail: (id) => [...interactionKeys.details(), id] as const,
};
```

That shape is what makes selective invalidation possible: `interactionKeys.all` clears the
whole domain, `interactionKeys.lists()` touches only lists. Never write a raw array key
inline.

### Other frontend rules

- **Barrel exports**: a `components/<domain>/` directory gets an `index.ts` re-exporting its
  public components. Import from the barrel, not from deep paths.
- **Page length**: over ~250 lines, extract child components.
- **Mock data**: put it in `*.mock.ts` with a `// TODO: connect the API` comment. Never
  inline a mock array inside a page.
- **Server vs client components**: default to server components. Add `"use client"` only
  when you need hooks, state or event handlers — and put it as high as needed but no
  higher.
- **`params` is a Promise in Next 16**: `const { id } = await params;`.

---

## Backend — which layer for which job

| Need | Where | Never |
|---|---|---|
| A new endpoint | `api/v1/` — thin: validate → call domain/repository → return a schema | Business logic or a DB query inside the route |
| Pure logic (normalisation, pairing, severity) | `domain/` | Importing `fastapi`, `sqlalchemy` or `openai` there |
| Database access | `db/repositories/` | A query written anywhere else |
| A prompt | `prompts/prompt_templates.py` | An f-string prompt inline in a node |
| Calling the model | `llm/llm_client.py` | Importing the OpenAI SDK elsewhere |
| A tunable number | `config.yaml` | A magic number in code |
| Request/response shape | `schemas/` (Pydantic v2) | A raw `dict` returned from a route |

### Other backend rules

- **Type hints are required** on every public function — a grading criterion.
- **No bare `except:`.** Catch the specific exception, or let the central handler in
  `api/errors.py` deal with it.
- **Async for all I/O on the request path.** A synchronous DB or HTTP call blocks the event
  loop for every other request.
- **Absolute imports**: `from medsafe.domain.severity import ...`, never relative `..`.
- **Pydantic v2**: `model_config = SettingsConfigDict(...)`, not `class Config`.
- ruff, line length 120, rules `E,F,I,N,W,UP`. Run `make check` before pushing.

---

## Tests

- `backend/tests/unit/domain/` must run with **no LLM, no database, no network**. This is
  where normalisation accuracy is measured for `eval/`, so it has to be reproducible.
- Mock the model through the `mock_llm` fixture in `conftest.py`. Never call OpenAI for real
  in a test.
- A test marked `@pytest.mark.skip` must say why in `reason=`.
- Anything touching the warning path needs a regression test — see
  [ADR 0004](../adrs/0004-drug-drug-lookup-not-similarity.md) for the specific case that
  must never regress.

---

## Git

- Commit messages in **English**, Conventional Commits: `feat:`, `fix:`, `docs:`,
  `refactor:`, `chore:`.
- One branch per ticket, named after it: `VMEC-16`.
- Update `specs/` in the **same pull request** as the behaviour change.
- Never commit `.env`. Never `git push --no-verify` — it skips the AI-log submission.

---

## Not decided yet

Do not invent a convention for these; raise it in
[`planning/backlog.md`](../planning/backlog.md) and let the team choose once.

| Topic | State |
|---|---|
| Frontend testing framework | Nothing installed. No frontend tests exist |
| Backend logging | `backend/logs/` exists but no logger is configured, and no format is agreed |
| Alembic migrations | Alembic is a dependency; there is no `alembic.ini` and no `versions/` yet |
| API envelope | Open question Q1 — see [`planning/backlog.md`](../planning/backlog.md) |
