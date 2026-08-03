# CLAUDE.md

All project context lives in `AGENTS.md`, which is shared by every AI tool.

@AGENTS.md

---

## Claude Code specifics

### Available subagents (`.claude/agents/`)
- **citation-auditor** — audits the "never invent a warning" rule: every warning must carry
  a verbatim quote and its source.
- **api-contract-checker** — detects drift between the backend routers and
  `frontend/src/lib/api/types.gen.ts`.
- **gate-reviewer** — reviews a diff against the programme's five grading axes.

### Available slash commands (`.claude/commands/`)
- `/worklog` — draft the daily entry for `WORKLOG.md` (deliverable #9)
- `/journal` — draft the weekly entry for `JOURNAL.md` (deliverable #8)
- `/gate-check` — check the status of all ten deliverables before a gate

### Notes
- `.claude/settings.json` contains the programme's logging hooks — **do not edit it**.
  Personal configuration belongs in `.claude/settings.local.json` (already gitignored).
- Open the repository at the root, `P-054/`, never at `backend/` or `frontend/` — see the
  warning at the top of `AGENTS.md`.
