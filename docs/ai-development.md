# Hướng dẫn phát triển với AI agent

Tài liệu này hướng dẫn thành viên cung cấp đúng context cho AI và kiểm soát quá trình
implement. AI không thay thế Jira, spec, ADR, test hoặc human review.

## Bốn nguồn context bắt buộc

| Nguồn | Sở hữu nội dung | Cách cung cấp cho agent |
|---|---|---|
| `AGENTS.md` | Quy tắc repository, ranh giới code, protected paths | Mở đúng root và yêu cầu agent xác nhận đã đọc |
| Jira `VMEC-NN` | Delivery request, assignee, priority, sprint, status | Cung cấp key, link, goal, acceptance criteria và non-goals |
| Workspace tính năng | `spec.md`, `plan.md`, `tasks.md`, contract, data model, checklist | Ghi rõ đường dẫn trong prompt |
| ADR và engineering docs | Kiến trúc và quy ước đã duyệt | Nêu đúng ADR cùng backend/frontend guide liên quan |

Link Jira private không tự biến thành context. Nếu công cụ không có connector Jira đã xác
thực, member phải paste goal, acceptance criteria và non-goals vào cuộc trò chuyện.

## Công cụ AI đọc context từ đâu?

| Công cụ | Điểm vào context |
|---|---|
| Codex | `AGENTS.md` |
| Claude Code | `CLAUDE.md`, sau đó import `AGENTS.md` |
| Cursor | `.cursor/rules/project.mdc` trỏ tới `AGENTS.md` |
| GitHub Copilot | `.github/copilot-instructions.md` trỏ tới `AGENTS.md` |
| Công cụ khác | Phải yêu cầu rõ đọc `AGENTS.md` và tài liệu liên quan |

Luôn mở workspace tại `P-054/`. Đầu mỗi session, yêu cầu agent báo:

1. repository root;
2. Jira issue và feature workspace;
3. các file đã đọc;
4. scope và non-goals;
5. kế hoạch cùng lệnh kiểm tra;
6. protected paths không được sửa.

Sai bất kỳ mục nào thì dừng trước khi agent edit file.

## Khi nào dùng quy trình tính năng đầy đủ?

| Thay đổi | Cách làm |
|---|---|
| Hành vi mới, API contract, safety rule, data invariant hoặc luồng nhiều bước | Dùng đầy đủ spec → plan → tasks → review → implement → validation |
| Spec còn ambiguity | Leader làm rõ và cập nhật artifact bị ảnh hưởng trước khi code |
| Quyết định kiến trúc khó đảo ngược | Leader duyệt ADR mới trước khi chốt plan |
| Tính năng đã được duyệt | Agent implement task chưa hoàn thành theo thứ tự dependency |
| Typo, dependency hoặc refactor giữ nguyên hành vi | Jira + tài liệu/test liên quan; không cần workspace mới nếu rủi ro thấp |

## Luồng dùng agent cho một tính năng

```text
Jira goal + acceptance criteria + non-goals
→ agent đọc AGENTS + product baseline + ADR liên quan
→ leader duyệt spec.md
→ leader duyệt plan/research/data-model/contract
→ leader duyệt tasks/checklist
→ agent implement từng task theo dependency
→ test cục bộ sau mỗi nhóm thay đổi
→ test toàn repo + contract + quickstart + số đo thật
→ agent đối chiếu code với spec/plan/tasks và bổ sung việc thiếu
→ PR + CI + human review + merge + cập nhật Jira
```

## Mẫu yêu cầu tạo hoặc cập nhật đặc tả

```text
Jira issue: VMEC-NN
Goal: <kết quả người dùng cần đạt>
Acceptance criteria: <nội dung đã được leader duyệt>
Non-goals: <phạm vi loại trừ>

Làm việc từ repository root. Đọc AGENTS.md, specs/product-vision.md,
specs/app-flow.md, specs/domains.md và ADR liên quan.
Chỉ tạo/cập nhật spec.md bằng tiếng Việt chuyên ngành. Không lập kế hoạch hoặc viết code.
Nêu rõ ambiguity thay vì tự đưa assumption.
```

Leader kiểm tra user story, acceptance criteria quan sát được, edge case, success criteria,
scope và traceability. Framework, database và tên file không thuộc spec hành vi nếu người
dùng không quan sát được.

## Mẫu yêu cầu triển khai

```text
Jira issue: VMEC-NN
Feature workspace: specs/NNN-feature-name/

Đọc AGENTS.md, acceptance criteria của Jira, spec.md, plan.md, tasks.md, contract,
checklist, ADR liên quan, docs/code-style.md và backend/frontend guide cho vùng code sẽ sửa.

Trước khi edit, hãy tóm tắt scope đã duyệt, non-goals, task chưa hoàn thành tiếp theo và
lệnh kiểm tra dự kiến. Sau đó implement theo dependency. Không thay đổi hành vi hoặc kiến
trúc đã duyệt để làm code dễ hơn. Chạy test phù hợp sau mỗi nhóm thay đổi.
```

Agent implement `tasks.md`, không implement “ý trong đầu leader”. Artifact sai sẽ dẫn tới
code sai dù agent thực hiện chính xác. Vì vậy human review trước code là bắt buộc.

Agent không tự có quyền:

- sửa protected paths;
- đổi contract/architecture đã duyệt;
- deploy hệ thống hoặc cập nhật Jira thật;
- tạo/đọc secret không được cung cấp;
- bypass test, CI hoặc Git hook.

## Kiểm chứng sau triển khai

```bash
make check
make web-lint
make web-build
git diff --check
```

Ngoài các lệnh trên:

- chạy toàn bộ scenario trong `quickstart.md`;
- đối chiếu runtime OpenAPI với contract đã duyệt;
- ghi measurement thật vào `eval/`;
- rà code với từng FR/SC và task;
- bổ sung task còn thiếu, implement rồi chạy lại validation;
- kiểm tra GATE checksum và CI trước merge.

Không chấp nhận câu “test pass” nếu agent không báo command và kết quả. Suite mà toàn bộ
test bị skip không phải evidence implementation.

## Agent kiểm toán có sẵn trong Claude Code

- `citation-auditor`: truy vết cảnh báo tới bằng chứng nguyên văn.
- `api-contract-checker`: so backend contract với frontend generated types và cách sử dụng.
- `gate-reviewer`: review repository theo deliverable/rubric chương trình.

Đây là lớp audit bổ sung, không thay test, quickstart, CI hoặc human review. Nếu dùng nhiều
agent, chỉ chia audit read-only độc lập hoặc task không trùng file; không để hai agent sửa
cùng artifact đồng thời.

## Danh sách kiểm tra khi bàn giao phiên làm việc

Yêu cầu agent báo:

- Jira issue và feature workspace đã dùng;
- file đã sửa và lý do;
- task hoàn thành/chưa hoàn thành;
- command đã chạy, kết quả chính xác và test bị skip;
- ảnh hưởng tới contract, migration, config và docs;
- quyết định còn chờ leader;
- xác nhận không sửa sai GATE, generated API types, logging infrastructure hoặc secret.
