# ADR 0003 — Workspace directory structure

- **Status:** Accepted
- **Date:** 2026-08-03

## Context

The repository has to hold **the whole project context in one place** so that the team and
AI tools read the same thing, understand the same thing, and update the same thing — not
just code, with the specification scattered across Google Docs, Figma comments and chat.

## Decision

```
P-054/
├── specs/              product and domain specification
├── adrs/               architecture decisions (this file)
├── planning/           backlog and sprints
├── backend/            ★ Python source (instead of /src)
├── frontend/           ★ Next.js source (instead of /src)
├── docs/               supporting docs, programme guidebook, architecture diagram
├── dataset/            source data
├── eval/               deliverable #10
├── gate/               ★ submitted work — DO NOT TOUCH
├── presentation/  scripts/  .ai-log/
├── AGENTS.md           the rules for AI tools and the team
├── README.md           project introduction
├── WORKLOG.md  JOURNAL.md
└── .env  .venv/        ★ must live at the root
```

### Deliberate deviations from the reference workspace layout

| Reference | Here | Why |
|---|---|---|
| `/src` — one source directory | `backend/` + `frontend/` | This is a two-language monorepo with two toolchains (uv and Yarn), two Dockerfiles and two build lifecycles. Merging them into `/src` gains nothing and breaks the uv workspace |
| — | `gate/`, `.ai-log/`, `scripts/` | Required by the AI20K programme |
| — | `dataset/` | Source data, not code |
| `/tasks` — one file per user story | dropped; work items live in `planning/` | With a four-person team and Jira already in use, a third place to track work drifts out of date faster than it helps |

The reference layout says *"/src — the project codebase"*. The point is that **code sits
apart from context**; two source directories still honour that.

## No-go areas

| Do not touch | Why |
|---|---|
| `gate/gate_1/` | Submitted for GATE 1. Do not edit, delete, rename or move it |
| `scripts/`, `.ai-log/` | The programme's AI logging infrastructure |
| `.env` at the root | `submit_log.py` calls `load_dotenv()` relative to the working directory |
| `.venv/` at the root | `scripts/_pyrun.sh` only looks for a virtualenv at the repository root |
| The `hooks` blocks in `.claude/settings.json`, `.cursor/hooks.json`, `.codex/hooks.json`, `.gemini/settings.json`, `.github/hooks/hooks.json` | Logging hooks |
| The name `dataset/` | `.gitignore` ignores `data/` — renaming would drop the data out of git |

## Workspace rule

**Always open the repository at its root, `P-054/`.** Never open `backend/` or `frontend/`
as the IDE workspace.

The logging hooks use paths relative to the repository root. Opened in a subdirectory, the
tool cannot find `.claude/` or `.cursor/`, so **no hook runs, nothing is logged, and
nothing reports an error**. Someone can push for a week and score zero on AI logs.

## Consequences

✅ Specification, decisions, planning and code share one git history — versioned,
reviewable, traceable
✅ AI tools get the full context without anyone pasting it in each time

❌ Three documentation directories to keep current; if they drift they are worse than
having nothing
❌ Mild overlap between `specs/` and `docs/architecture_diagram.md` (a graded deliverable) —
accepted, because `docs/` carries marks and stays as it is
