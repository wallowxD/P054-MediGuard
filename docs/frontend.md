# Frontend guide

Next.js 16 (App Router) + React 19 + strict TypeScript + Tailwind v4.

> **Read this before writing any frontend code.** The `frontend/` directory holds source
> only — all documentation lives here, outside the codebase.

---

## ⚠️ This is NOT the Next.js you know

Next 16 has breaking changes: APIs, conventions and file structure may all differ from what
a model learned during training. Read the relevant guide in
`frontend/node_modules/next/dist/docs/` before writing code, and heed deprecation notices.

The most visible example: **`middleware.ts` is now `proxy.ts`**.

Also: always open the repository at its root, `P-054/` — never `frontend/`. The AI logging
hooks use paths relative to the root, and opening the wrong directory silently loses every
log.

---

## Quick start

Every command runs from the **repository root**, not from `frontend/`:

```bash
corepack enable     # once per machine — fetches the pinned Yarn 4
make web-install    # yarn install
make web            # dev server -> http://localhost:3000
make web-build      # next build
make web-lint       # eslint
make dev            # alongside the backend on :8000
```

Environment variables: copy `frontend/.env.example` to `frontend/.env.local` and generate
`NEXTAUTH_SECRET` with `openssl rand -base64 32`.

### The package manager is Yarn 4, not npm

The version is pinned in the `packageManager` field of `frontend/package.json` and fetched
through corepack.

- ❌ No `npm install` — it produces a `package-lock.json` that fights `yarn.lock`.
- ❌ No `npm i -g yarn` — that installs Yarn 1.x, with the wrong lockfile format.
- ❌ No `npx next dev` — npx downloads a different `next` into a temporary cache, and the
  resulting error points in the wrong direction (it claims Turbopack cannot find the
  workspace root, when the real cause is a missing `node_modules`).

`nodeLinker: node-modules` in `.yarnrc.yml` — PnP is deliberately not used, so TypeScript
works in VS Code without a separate SDK.

---

## Structure

```
Page/Component → queries/* → services/* → utils/request.ts → backend
                (React Query)  (plain HTTP)  (axios + refresh token)
```

| Path | Purpose |
|---|---|
| `src/app/(public)/` | Landing page `/`, sign-in and sign-up, legal pages |
| `src/app/(protected)/` | Signed-in users — dashboard, interaction lookup, settings |
| `src/app/(review)/` | `PHARMACIST` role — review queue, under `/review` |
| `src/proxy.ts` | **The real access gate**, running at the edge |
| `src/constants/` | `api.ts` (endpoints) · `routes.ts` (routes and roles) |
| `src/queries/` · `src/services/` | React Query hooks · plain HTTP layer |
| `src/store/` | Redux Toolkit — **client state only** |
| `src/components/landing/` | Landing-page sections |
| `src/components/interactions/` | Warning cards, severity badges, citation blocks |

### Layering rules

- Components **never** import `services/*` directly — always go through `queries/*` for
  caching, `isLoading` and invalidation.
- `services/*` imports no React and contains no hooks.
- `store/` holds **client state only** (filters, the basket of selected medicines). API data
  belongs to React Query; copying it into Redux creates two sources of truth.
- Endpoints are declared in `constants/api.ts`, routes and roles in `constants/routes.ts`.

Three access tiers: `(public)` · `(protected)` · `(review)`. A route group is **not** a
security boundary — see [ADR 0007](../adrs/0007-frontend-structure-and-auth.md).

### Adding a feature — in this order

```
1. constants/api.ts                 → endpoint
2. types/<domain>.d.ts              → request/response interfaces
3. services/<domain>/index.ts       → *Request functions
4. queries/<domain>.ts              → key factory + hooks
5. components/<domain>/             → reusable UI + index.ts
6. app/(protected)/<route>/page.tsx → assemble
7. constants/routes.ts              → register it if public or review
```

---

## Constraints when writing code

- `src/lib/api/types.gen.ts` is **GENERATED** from `openapi.json` — never edit it by hand.
  Once it exists, reconcile `src/types/*.d.ts` (currently hand-written) and delete the
  duplicates.
- The backend API **does not exist yet**: function bodies in `services/*` are commented out
  and call `apiNotReady()`. Restore them, following each TODO, as the backend enables the
  matching router.
- The `{ error, message, data }` envelope in `types/backend.d.ts` is **unconfirmed** —
  FastAPI returns payloads directly by default. See open question Q1 in
  [`planning/backlog.md`](../planning/backlog.md).
- Dark mode and responsiveness are **grading criteria**, not nice-to-haves.
- Strict TypeScript. Alias `@/*` → `./src/*`.
- Keep `output: "standalone"` in `next.config.ts` — the Docker build depends on it.
- `NEXT_PUBLIC_*` variables are baked into the bundle at build time, not read at runtime. To
  change one in Docker, edit `build.args` in `docker-compose.yml`, not `environment`.
- **Application routes must not contain a dot.** The proxy matcher excludes every path with
  a file extension, so a dotted route would fall outside the protected set.

---

## Non-obvious decisions

This project was scaffolded from a frontend boilerplate written for **Next 15 +
Tailwind v3**. That template is no longer in the repository, but it shaped the structure,
and several places deliberately diverge from it. If something looks unconventional, this is
usually why:

| Convention elsewhere | Here | Why |
|---|---|---|
| `middleware.ts` | **`src/proxy.ts`** | Next 16 renamed it; the old name emits a deprecation warning |
| `tailwind.config.ts` | tokens via `@theme` in `globals.css` | Tailwind v4 dropped the JS config |
| `useRef` for a one-time store | `useState(makeStore)` | React 19's `react-hooks/refs` rule reports "Cannot access refs during render" |
| Providers wrapping `<html>` | providers inside `<body>` | The App Router requires `<html>`/`<body>` to be the root layout's root |
| Matcher listing image extensions | excludes **every path with an extension** | Otherwise `sitemap.xml`, `robots.txt`, `.webmanifest` and `.pdf` all get redirected to `/signin` |
| `/` redirects to `/signin` | `/` is the **landing page** | Guests must be able to see the marketing page |
| Static `public/robots.txt` | generated at `src/app/robots.ts` | A static file hardcodes the sitemap URL, so a real deployment still points at localhost |
| A Google avatar host in `images.remotePatterns` | empty array | No Google OAuth here, and each entry is a hole in the image optimiser's allowlist |
| `watch()` inside a `validate` callback | `validate`'s `formValues` argument | `watch()` makes React Compiler skip memoising the whole component |

Full reasoning: [ADR 0007](../adrs/0007-frontend-structure-and-auth.md) and
[ADR 0008](../adrs/0008-toolchain-version-pins.md).

---

## Product rules still apply in the UI

Every interaction warning displayed **must carry its verbatim quote and source**, and a
warning a pharmacist has not yet approved still appears immediately, labelled *"awaiting
professional confirmation"* — it never blocks the flow.

All three rules: [`specs/product-vision.md`](../specs/product-vision.md).

---

## Status

The backend has no auth module and has not enabled its business routers yet, so the
function bodies in `src/services/*` are commented out and call `apiNotReady()`. Restore
them, following each TODO, as the backend becomes ready — see
`backend/src/medsafe/api/routes.py`.
