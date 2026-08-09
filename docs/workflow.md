# Quy trình bàn giao — Jira + đặc tả được duyệt

Repository tách delivery management khỏi tri thức bền vững của sản phẩm. Jira cho biết
**ai làm gì, khi nào**; repository cho biết **cần xây gì, tại sao và xây thế nào**.

## Nguồn sự thật

| Nội dung | Nguồn sở hữu |
|---|---|
| Ticket, sprint, assignee, priority, status | Jira project `VMEC` |
| Yêu cầu và thuật ngữ toàn sản phẩm | Các file trực tiếp trong `specs/` |
| Hành vi và acceptance criteria của tính năng | `specs/NNN-feature-name/spec.md` |
| Phương án kỹ thuật đã duyệt | `plan.md`, `research.md`, `data-model.md`, `contracts/` |
| Quyết định khó đảo ngược | `adrs/` |
| Phân rã kỹ thuật | `tasks.md` của tính năng |
| Quy ước code và vận hành | `docs/` |
| Số đo thực tế | `eval/` |

`planning/` chỉ được chứa README trỏ tới Jira; không tạo backlog, roadmap, bảng owner hoặc
trạng thái thứ hai trong repository.

## Khi nào cần workspace tính năng?

Dùng workspace `specs/NNN-feature-name/` khi thay đổi:

- hành vi người dùng;
- API contract;
- quy tắc an toàn;
- data invariant;
- luồng nhiều bước;
- thay đổi lớn cần traceability giữa requirement, code và test.

Sửa typo, cập nhật dependency hoặc refactor không đổi hành vi có thể chỉ dùng Jira ticket,
nhưng vẫn phải cập nhật test và tài liệu liên quan.

Quyết định khó đảo ngược cần ADR mới. Không viết lại lịch sử ADR đã chấp nhận; tạo ADR số
lớn hơn và đánh dấu ADR cũ bị thay thế.

## Quy trình tính năng

1. Tạo/chọn Jira issue `VMEC-NN`, gán sprint, assignee, priority, status và product context.
2. Tạo branch tên đúng bằng Jira key từ base branch đã thống nhất, ví dụ `VMEC-12`.
3. Leader/PO duyệt `spec.md`: user story, acceptance criteria, edge case, success criteria
   và non-goals; không đưa chi tiết framework vào spec hành vi.
4. Làm rõ mọi ambiguity. Luồng cảnh báo không được triển khai dựa trên assumption chưa duyệt.
5. Duyệt `plan.md`, ADR impact, research, data model và contract trước khi code.
6. Duyệt `tasks.md`: dependency rõ, map đủ FR/SC, có file/module đích, không chép trường
   quản lý của Jira.
7. Với luồng cảnh báo, hoàn thành safety checklist trước khi code.
8. Developer hoặc AI agent implement đúng task đã duyệt; phát hiện thay đổi intent thì dừng
   và đưa lại leader, không tự sửa contract để code dễ hơn.
9. Chạy test, contract validation và toàn bộ `quickstart.md`; ghi số đo thật vào `eval/`.
10. So code với spec/plan/tasks, bổ sung và hoàn thành mọi việc còn thiếu.
11. PR link Jira issue và feature spec; CI pass, review xong mới merge; cập nhật Jira bằng
    PR và evidence sau merge.

## Điều kiện duyệt trước khi code

Leader xác nhận:

- Jira ticket và feature workspace trỏ lẫn nhau;
- acceptance criteria quan sát/kiểm thử được;
- edge case và unavailable state đã được mô tả;
- spec, plan, contract, data model và ADR không mâu thuẫn;
- warning path tuân thủ ADR 0012, 0005 và 0006;
- assumption chưa duyệt được ghi rõ và chặn implement;
- tasks map đủ requirement, không chứa assignee/priority/sprint/status.

## Điều kiện merge pull request

Các workflow trong `.github/workflows/` phải pass:

- **Repository integrity:** kiểm tra ownership của Markdown/planning và cấu hình Docker
  Compose.
- **Backend lint, format, tests:** cài dependency từ lockfile rồi chạy ruff và pytest.
- **Frontend lint và build:** cài Yarn immutable, chạy ESLint, TypeScript và production build.

Branch protection của `main` phải bắt buộc PR, ít nhất một approval, resolve conversation,
branch cập nhật và toàn bộ checks; chặn force push và xóa branch.

## Quy ước Jira và Git

- Project key: `VMEC`.
- Branch: đúng Jira key và chỉ Jira key, ví dụ `VMEC-37` — không `feature/VMEC-37`.
- Commit: tiếng Anh theo Conventional Commits, scope là Jira key của branch:
  `<type>(VMEC-37): <mô tả thể mệnh lệnh>`. Ví dụ `feat(VMEC-37): add exact pair lookup`.
  Không đặt ticket key ở cuối câu. Merge commit của GitHub được miễn.
- PR: link Jira và `spec.md`, tóm tắt evidence thay vì chép task list.
- Jira là nơi duy nhất thay đổi sprint, assignee, priority và status.

Hướng dẫn dùng AI agent: [ai-development.md](ai-development.md).
