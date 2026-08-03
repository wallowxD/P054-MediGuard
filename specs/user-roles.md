# User Roles & Permissions

> Source: the UI flow in [gate/gate_1/](../gate/gate_1/README.md) — the diagram splits
> into two roles after sign-in.
> Implementation: `frontend/src/constants/routes.ts` and `frontend/src/proxy.ts`.

---

## Two roles

| Role | Constant | Who |
|---|---|---|
| Patient / carer | `ROLES.PATIENT` | End user looking up their own medicines |
| Doctor / pharmacist | `ROLES.PHARMACIST` | Clinical staff who review warnings |

Two roles only. If a third one appears (a system admin, say), **do not add another route
group** — use `PermissionGuard` at component level. See
[`adrs/0007-frontend-structure-and-auth.md`](../adrs/0007-frontend-structure-and-auth.md).

## Three access tiers

| Tier | Route group | URL | Who gets in |
|---|---|---|---|
| Guest | `(public)` | `/`, `/signin`, `/signup`, legal pages | Everyone |
| Signed in | `(protected)` | `/dashboard`, `/interactions`, `/settings` | PATIENT + PHARMACIST |
| Clinical | `(review)` | `/review/**` | PHARMACIST only |

Split by **access tier**, not by individual role.

---

## Flows

### Patient

Home → pick one of three functions:

1. **Check drug interactions** — upload or photograph a prescription → the system
   recognises the medicines → confirm the list → run the lookup → show results if data
   exists, otherwise report *"no data available"* and file a check request
2. **Look up drug information** — search for a medicine → read its information
3. **Check a medicine against an existing condition** — pick a medicine and a condition →
   see the result and any cautions

> ⚠️ Function 3 appears in the UI flow submitted for GATE 1, but "drug–condition
> interactions" is listed under **Out of scope** in the PRD. The scope needs to be settled
> before anyone implements it — see [`planning/backlog.md`](../planning/backlog.md).

### Doctor / pharmacist

Receive the **queue of check requests** (from the "send for comparison" and "send for
check" flows) → open a request → read the result and its sources → approve it if it looks
right, or **edit the content and then approve**.

---

## Permission matrix

| Action | PATIENT | PHARMACIST |
|---|:---:|:---:|
| Run an interaction check | ✅ | ✅ |
| See `pending` warnings | ✅ | ✅ |
| File a check request | ✅ | ✅ |
| Add a personal note to a warning | ✅ | ✅ |
| Enter `/review/**` | ❌ | ✅ |
| Approve or reject a warning | ❌ | ✅ |
| Edit warning text, quotes, severity | ❌ | ✅ |

Patients **can see** unapproved warnings (rule 3) but **cannot edit** sourced content.

---

## Three layers of defence

| Layer | Where | Role |
|---|---|---|
| 1. Proxy (edge) | `frontend/src/proxy.ts` | **The real gate** — runs before render |
| 2. Layout | `(review)/layout.tsx` | Backstop if the matcher changes or a new route is missed |
| 3. Backend | every endpoint | **Mandatory.** The only layer that cannot be bypassed |

⚠️ Blocking in the frontend is **UX only** — hiding buttons and avoiding wrong pages. A
user can always call the API directly with their own token. **The backend must enforce
permissions on every endpoint**, with no exceptions.
