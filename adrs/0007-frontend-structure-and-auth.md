# ADR 0007 — Frontend structure and authorisation

- **Status:** Accepted
- **Date:** 2026-08-03
- **Commit:** `0ce2bb0 feat(frontend): scaffold Next.js 16 app with role-aware structure`

## Decision

### Data layering

```
Page/Component → queries/* → services/* → utils/request.ts → backend
                (React Query)  (plain HTTP)  (axios + single-flight refresh)
```

- Components **never** import `services/*` directly — always go through `queries/*` so you
  get caching, `isLoading` and invalidation
- `services/*` imports no React and contains no hooks
- `store/` (Redux Toolkit) holds **client state only** (UI filters, the basket of selected
  medicines). API data belongs to React Query. Copying it into Redux creates two sources of
  truth that drift apart unnoticed
- Endpoints are declared in `constants/api.ts`, routes and roles in `constants/routes.ts`

### Authorisation: block at the edge, not in the layout

Three route groups by **access tier**: `(public)`, `(protected)`, `(review)`.

★ **A route group is not a security boundary.** The directory name `(review)` blocks
nobody — it only groups a layout and never appears in the URL.

Relying on a client-side layout to block access means:
1. The proxy lets the request through because the token is valid
2. The server renders the page and ships the JavaScript bundle to the client
3. Only after hydration does `useEffect` run and redirect

The result is a flash of the protected UI, and any API calls on that page have already
fired.

The real gate is **`src/proxy.ts`**, running at the edge and matching on the `/review` URL
prefix.

Three layers of defence: proxy (real) → layout (backstop) → **backend (mandatory)**.

### More than two roles

Keep the three groups and handle finer permissions with `PermissionGuard` at component
level. **Do not express a permission matrix as a directory tree** — every new role
multiplies the folders, and a route two roles can both reach has nowhere to live.

## Deliberate deviations from the original boilerplate

The frontend was scaffolded from a boilerplate written for Next 15 and Tailwind v3. That
template is no longer in the repository; these are the places we deliberately diverge from
it, because following it literally breaks things here:

| Template | Here | Why |
|---|---|---|
| `middleware.ts` | **`src/proxy.ts`** | Next 16 renamed it; the old name emits a deprecation warning |
| `tailwind.config.ts` | tokens via `@theme` in CSS | Tailwind v4 dropped the JS config |
| `useRef` in StoreProvider | `useState(makeStore)` | React 19 lints `Cannot access refs during render` |
| Providers wrapping `<html>` | providers inside `<body>` | The App Router requires `<html>`/`<body>` to be the root layout's root |
| Matcher listing a few image extensions | exclude **every path with a file extension** | The original matcher redirected `sitemap.xml`, `robots.txt`, `.pdf` and friends to `/signin` |
| Static `public/robots.txt` | generated at `app/robots.ts` | The static file hardcodes the sitemap URL, so a real deployment still points at localhost |
| `/` redirects to `/signin` | `/` is the **landing page** | Product requirement: guests must be able to see the marketing page |

**Consequence of the new matcher to remember:** application routes **must not contain a
dot**, or they fall outside the protected set.

## Consequences

✅ Adding a feature has a clear order: endpoint → type → service → query → component → page
✅ Authorisation blocks before render, with no UI flash

❌ Several layers for one API call, which looks like ceremony to a newcomer
❌ It takes discipline: calling `services/` straight from a component loses caching and
nobody notices immediately
