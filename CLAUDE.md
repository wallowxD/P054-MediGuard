# CLAUDE.md

Toàn bộ ngữ cảnh dự án nằm ở `AGENTS.md` (dùng chung cho mọi AI tool).

@AGENTS.md

---

## Riêng cho Claude Code

### Subagent có sẵn (`.claude/agents/`)
- **citation-auditor** — soát luật "không bịa cảnh báo": mọi cảnh báo phải gắn
  đoạn trích nguyên văn + nguồn.
- **api-contract-checker** — soát lệch contract giữa router backend và
  `frontend/src/lib/api/types.gen.ts`.
- **gate-reviewer** — review diff theo đúng 5 trục BTC chấm điểm.

### Slash command có sẵn (`.claude/commands/`)
- `/worklog` — soạn entry hàng ngày cho `WORKLOG.md` (deliverable #9)
- `/journal` — soạn entry hàng tuần cho `JOURNAL.md` (deliverable #8)
- `/gate-check` — soát trạng thái 10 deliverable trước mỗi gate

### Lưu ý
- `.claude/settings.json` chứa hook logging của BTC — **không sửa**.
  Cấu hình cá nhân để ở `.claude/settings.local.json` (đã gitignore).
- Mở repo ở root `P-054/`, không mở `backend/` hay `frontend/` — xem cảnh báo
  đầu `AGENTS.md`.
