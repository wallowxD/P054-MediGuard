# Runbook

Operational procedures: how to run things, and what to do when they break.

For *why* the system is shaped this way, see [`adrs/`](../adrs/). This file is only
"which command, in what order, and what the failure looks like".

---

## Daily operations

### Start everything locally

```bash
make dev        # backend :8000 + frontend :3000, one Ctrl-C stops both
```

Separately, in two terminals:

```bash
make run        # backend only
make web        # frontend only
```

### Run the whole stack in containers

```bash
make up         # Postgres + backend + frontend
docker compose ps        # all three must report (healthy)
make down
```

Requires `NEXTAUTH_SECRET` in the root `.env`. Compose fails loudly if it is missing — see
the incident below.

### Health checks

| Check | Expected |
|---|---|
| `curl localhost:8000/health` | `{"status":"ok","env":"development"}` |
| `curl localhost:8000/api/v1/status` | `{"status":"ready",...}` |
| `curl -o /dev/null -w '%{http_code}' localhost:3000` | `200` (landing page, signed out) |
| `curl -o /dev/null -w '%{http_code}' localhost:3000/dashboard` | `307` (redirect to sign-in) |

If `/` returns 307 while signed out, authentication is misconfigured — see incident 1.

### Before pushing

```bash
make check      # backend: ruff + format + pytest
make web-lint   # frontend: eslint
make web-build  # frontend: type check + build
```

### Run the ingestion pilot

```bash
make ingest-pilot     # 50 medicines, per the PRD
```

Measure extraction coverage **before** processing all 1073. If coverage is under ~30%,
change the extraction approach rather than scaling up a bad pipeline.

---

## Incidents

### 1. Every route redirects to `/signin?error=Configuration`

**Symptom:** even the public landing page returns 307. Containers still report `healthy`,
because the health check only asks whether the server answers.

**Diagnose:**
```bash
docker compose logs frontend | grep NO_SECRET
```

**Cause:** `NEXTAUTH_SECRET` is not reaching the frontend container, so next-auth refuses to
run and `withAuth` rejects everything.

**Fix:** put `NEXTAUTH_SECRET` in the root `.env` (`openssl rand -base64 32`), then
`make down && make up`. Compose is configured to fail with an explicit message if the
variable is absent, so this should not recur silently.

### 2. `sh: next: command not found`, or Turbopack cannot find the workspace root

**Cause:** `frontend/node_modules` is missing. The Turbopack message is misleading — the
real problem is simply that dependencies are not installed.

**Fix:** `make web-install`. Never use `npx next dev`: npx downloads a different `next` into
a temporary cache and produces exactly that misleading error.

### 3. Backend container exits with `ModuleNotFoundError: No module named 'medsafe'`

**Cause:** uv installs workspace members in editable mode by default, which only writes a
`.pth` file pointing at the source tree. The runtime stage of the image does not copy that
source.

**Fix:** the build already passes `--no-editable`. If this reappears, check that flag is
still present in `backend/Dockerfile`.

### 4. A port is still busy after `Ctrl-C`

Happens when the process was killed by PID (terminal closed abruptly, killed from Activity
Monitor) rather than interrupted, so the trap never ran.

```bash
pkill -f "uvicorn medsafe"; pkill -f "next dev|next-server"
lsof -ti:3000 -ti:8000        # confirm nothing is left
```

### 5. `sitemap.xml`, `robots.txt` or another static file redirects to `/signin`

**Cause:** the proxy matcher is catching it. The matcher excludes every path containing a
dot, so this only happens if the matcher was edited.

**Fix:** restore the exclusion in `frontend/src/proxy.ts`. Note the trade-off: application
routes must never contain a dot.

### 6. The pre-push hook fails

**Do not** run `git push --no-verify` — it skips the AI-log submission, which is graded.
Report the error to the team lead. Details in [AI_LOGGING_SETUP.md](../AI_LOGGING_SETUP.md).

### 7. AI logs show zero for someone

Almost always because they opened the IDE at `backend/` or `frontend/` instead of the
repository root. The hooks resolve paths relative to the root, find nothing, and fail
silently.

**Fix:** reopen at `P-054/`. There is no retroactive recovery — the prompts were never
recorded.

---

## Not set up yet

Do not follow instructions for these from elsewhere; they genuinely do not exist here.

| Procedure | State | Tracked as |
|---|---|---|
| Deployment / live URL | Nothing deployed; no hosting chosen | B-16 |
| Database migrations | Alembic is a dependency, but there is no `alembic.ini` and no `versions/` | Undecided, see [code-style.md](code-style.md) |
| Rollback procedure | Depends on deployment; cannot be written yet | after B-16 |
| Backend logging | `backend/logs/` exists but no logger is configured | Undecided |
| CI | No workflow runs `make check` or `make web-lint` | D-04 |

When one of these lands, add the procedure here in the same pull request.
