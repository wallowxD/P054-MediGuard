# API Contracts

> ⚠️ **Status: most of this does not exist yet.** The backend currently exposes only
> `/health` and `/api/v1/status`. What follows is an **agreed proposal**, declared on
> both sides so the frontend could be built against it:
>
> - Backend routers are stubbed in `backend/src/medsafe/api/routes.py` (commented out)
> - Frontend declares them in `frontend/src/constants/api.ts`
>
> Once implemented, **`backend/src/medsafe/schemas/` is the source of truth**: it
> generates `openapi.json`, which generates `frontend/src/lib/api/types.gen.ts`. If this
> file and the Pydantic schema disagree, trust the schema.

Base URL: `http://localhost:8000` · Prefix: `/api/v1`

---

## Existing

### `GET /health`
```json
{ "status": "ok", "env": "development" }
```

### `GET /api/v1/status`
```json
{ "status": "ready", "agent": "Medication Safety Copilot v0.1" }
```

---

## Proposed

### Interactions

#### `POST /api/v1/interactions/check`
Check interactions for a list of medicines.

```jsonc
// request
{ "drugIds": ["...", "..."], "foods": ["grapefruit juice"] }

// response
{
  "items": [ /* InteractionItem[] */ ],
  "notFound": ["warfarin|tamoxifen"]   // pairs with no data
}
```

★ `notFound` is **required**. It is how the system says *"no data available"* instead of
silently dropping a pair. Do not fold these into `items` with `severity: unknown`.

**InteractionItem:**
```jsonc
{
  "id": "...",
  "kind": "drug-drug",              // | "drug-food"
  "severity": "major",              // contraindicated|major|moderate|minor|unknown
  "reviewStatus": "pending",        // pending|approved|rejected
  "subject": "Warfarin",
  "object": "Aspirin",
  "mechanism": "...", "consequence": "...", "management": "...",
  "citations": [                    // ★ MUST NOT BE EMPTY
    { "quote": "verbatim text…", "source": "Warfarin leaflet",
      "sourceUrl": "https://…", "page": 3 }
  ]
}
```

#### `GET /api/v1/interactions` · `GET /api/v1/interactions/{id}`
List (filter by `severity`, `reviewStatus`, `kind`, paginated) and detail.

### Drugs

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/drugs/search?keyword=` | Name suggestions — goes through `domain/normalization.py` (fuzzy match) |
| `GET /api/v1/drugs` · `/{id}` | Catalogue and detail |

### Prescriptions

`GET` · `POST` · `GET /{id}` · `DELETE /{id}` under `/api/v1/prescriptions`.

### Reviews — PHARMACIST only

| Endpoint | Purpose |
|---|---|
| `GET /api/v1/reviews/queue` | Items awaiting review |
| `POST /api/v1/reviews/{id}/approve` | Approve |
| `POST /api/v1/reviews/{id}/reject` | Reject |

The backend **must check the role itself**. Do not rely on the frontend having hidden the
button.

### Auth

`register` · `tokens` (login and refresh) · `profiles` · `password` (recovery / reset /
update) under `/api/v1/auth/`.

---

## ⚠️ Open question

**Wrap responses in an `{ error, message, data }` envelope, or return the payload
directly?**

The frontend currently assumes **an envelope** (`frontend/src/queries/utils.ts` →
`withApiTransform`), inherited from the boilerplate. FastAPI returns payloads **directly**
by default.

Settle this early: changing it later means editing every hook. If we return payloads
directly, drop `withApiTransform` from the hooks rather than bending the query functions
around it.

---

## Conventions

- Routes stay **thin**: validate → call `domain/` or `db/repositories/` → return a schema.
  No database queries and no business logic inside a route.
- Async for all I/O on the request path.
- Errors go through the central handler in `api/errors.py`; never use a bare `except:`.
