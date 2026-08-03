# ADR 0010 — Áp dụng GitHub Spec Kit cho delivery tính năng

- **Trạng thái:** Bị thay thế bởi ADR 0014
- **Ngày:** 2026-08-03

## Bối cảnh lịch sử

Team cần flow lặp lại để tạo spec, plan, tasks, phân tích consistency, implement và
converge, trong khi Jira vẫn sở hữu delivery status.

## Quyết định khi đó

Áp dụng GitHub Spec Kit 0.15.1 với Codex integration. Runtime nằm trong `.specify/`, skill
nằm trong `.agents/skills/speckit-*`, feature state nằm trong `.specify/feature.json`.
Workspace tính năng vẫn ở `specs/NNN-feature-name/`; Jira không bị sao chép vào Git.

## Hệ quả lịch sử

- ✅ Có template và review loop nhất quán.
- ✅ Agent nhận task có traceability.
- ❌ Tăng số file managed, checksum và kiến thức công cụ cần duy trì.
- ❌ Tooling nặng hơn nhu cầu hiện tại của team.

ADR 0014 tạm dừng tích hợp này nhưng giữ lại các feature artifact hữu ích dưới dạng tài
liệu thường.
