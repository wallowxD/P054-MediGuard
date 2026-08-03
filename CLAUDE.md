# Hướng dẫn cho Claude Code

Toàn bộ context chung của dự án nằm trong `AGENTS.md`. Mọi AI tool phải tuân thủ cùng một
nguồn này.

@AGENTS.md

## Agent chuyên biệt (`.claude/agents/`)

- **citation-auditor:** kiểm tra quy tắc “không tự tạo warning”; mọi warning phải có quote
  nguyên văn và nguồn.
- **api-contract-checker:** phát hiện drift giữa backend router, OpenAPI contract và
  `frontend/src/lib/api/types.gen.ts`.
- **gate-reviewer:** đánh giá diff theo các tiêu chí chấm điểm của chương trình.

## Slash command (`.claude/commands/`)

- `/worklog`: soạn entry hằng ngày cho `WORKLOG.md`.
- `/journal`: soạn entry hằng tuần cho `JOURNAL.md`.
- `/gate-check`: kiểm tra trạng thái deliverable trước mỗi gate.

## Lưu ý bắt buộc

- `.claude/settings.json` chứa logging hook của chương trình, không được chỉnh sửa. Cấu
  hình cá nhân đặt tại `.claude/settings.local.json`, file này đã được gitignore.
- Luôn mở repository root `P-054/`, không mở riêng `backend/` hoặc `frontend/`; xem cảnh
  báo đầu `AGENTS.md`.
