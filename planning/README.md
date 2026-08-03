# Planning

**When** things happen. What and why live in [`specs/`](../specs/); how lives in
[`adrs/`](../adrs/).

| File | Contents |
|---|---|
| [backlog.md](backlog.md) | Remaining work by priority, **open questions**, technical debt |
| [sprints/](sprints/) | Goals, commitments and acceptance criteria per sprint |

## Milestones from the PRD

| | Milestone | Due | Status |
|---|---|---|---|
| M1 | Foundation | end of week 2 | ✅ [sprint-01](sprints/sprint-01.md) |
| M2 | Core flow | end of week 3 | 🔄 [sprint-02](sprints/sprint-02.md) |
| M3 | Complete MVP | end of week 4 | ⬜ |
| M4 | Polish | end of week 6 | ⬜ |

## Update cadence

| What | When |
|---|---|
| `backlog.md` | When priorities change, or an open question is settled |
| `sprints/sprint-NN.md` | Start of sprint (commitments) and end of sprint (outcome and lessons) |
| [`WORKLOG.md`](../WORKLOG.md) | **Daily** — deliverable #9, use `/worklog` |
| [`JOURNAL.md`](../JOURNAL.md) | **Weekly** — deliverable #8, use `/journal` |

> ⚠️ WORKLOG.md and JOURNAL.md are **still empty templates**. Both are graded.

## Where work items live

There is no separate `tasks/` directory. Work items live in `backlog.md` with a `B-xx`
identifier, and the current sprint carries owners and acceptance criteria for anything
risky. Jira holds the `VMEC-xx` tickets and git branches use the same numbers.

## Open questions

Keep them at the top of [`backlog.md`](backlog.md), not scattered through sprint files.
Each one names **an owner** and **a due date** — a question with no owner never gets
answered.
