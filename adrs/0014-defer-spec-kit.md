# ADR 0014 — Tạm dừng GitHub Spec Kit, giữ workflow spec nhẹ

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-03
- **Thay thế:** ADR 0010

## Bối cảnh

Ở giai đoạn hiện tại, team chưa cần runtime, managed template, skill và feature-state của
GitHub Spec Kit. Chi phí duy trì và onboarding lớn hơn lợi ích trước mắt. Tuy nhiên các
artifact `spec.md`, `plan.md`, `tasks.md`, contract, checklist và quickstart vẫn hữu ích cho
review và traceability.

## Quyết định

- Gỡ `.specify/` và `.agents/skills/speckit-*`.
- Gỡ bước kiểm checksum/runtime Spec Kit khỏi CI.
- Giữ `specs/NNN-feature-name/` như workspace tài liệu do team quản lý thủ công.
- Dùng Jira → review spec/plan/contract/tasks → implement → test/quickstart → PR/CI.
- Jira tiếp tục là nguồn duy nhất cho ticket, sprint, assignee, priority và status.
- Có thể áp dụng lại Spec Kit trong ADR mới nếu nhu cầu tăng; không phục hồi âm thầm.

## Hệ quả

- ✅ Onboarding và repository nhẹ hơn.
- ✅ Không cần Specify CLI hoặc managed checksum.
- ✅ Giữ được requirement traceability và pre-code review.
- ❌ Không còn command tự sinh/phân tích/converge artifact.
- ❌ Leader và reviewer phải kiểm tra consistency thủ công.
- ❌ Template có thể drift nếu team không giữ kỷ luật review.

## Phương án đã xem xét

- Giữ integration nhưng không dùng — bị loại vì vẫn tạo maintenance burden và gây nhầm.
- Xóa luôn feature artifacts — bị loại vì làm mất product/technical context đã được duyệt.
