# Checklist chất lượng yêu cầu: Feature 001

**Mục đích:** Xác nhận đặc tả đủ rõ và đủ khả năng kiểm thử trước implementation.

**Người duyệt:** Leader/PO và ít nhất một reviewer kỹ thuật.

- [ ] REQ001 Bốn user story mô tả giá trị người dùng, không mô tả chi tiết implementation.
- [ ] REQ002 Mỗi user story có acceptance criteria quan sát hoặc kiểm thử được.
- [ ] REQ003 FR-001–FR-019 không mâu thuẫn với product vision và app flow.
- [ ] REQ004 Exact drug–drug lookup và semantic drug–food retrieval được phân biệt rõ.
- [ ] REQ005 Trạng thái thiếu dữ liệu tách biệt hoàn toàn với `severity: unknown`.
- [ ] REQ006 Quy tắc citation, immutable evidence identity và review visibility không mơ hồ.
- [ ] REQ007 Pending hiển thị ngay; rejected không hiển thị cho patient.
- [ ] REQ008 Giới hạn request, duplicate, pair ordering và partial failure đã được định nghĩa.
- [ ] REQ009 Ngoài phạm vi và assumption đã được leader duyệt, không có scope ẩn.
- [ ] REQ010 SC-001–SC-008 có phương pháp đo, sample size hoặc evidence location rõ ràng.
- [ ] REQ011 Data model biểu diễn được mọi entity, state và invariant trong spec.
- [ ] REQ012 OpenAPI khớp data model về field, enum, required/null và cardinality.
- [ ] REQ013 Plan tuân thủ cấu trúc backend/frontend và các ADR hiện hành.
- [ ] REQ014 Mọi requirement có ít nhất một task và test/evidence task tương ứng.
- [ ] REQ015 `tasks.md` không sao chép assignee, priority, sprint hoặc workflow status từ Jira.
- [ ] REQ016 Không task nào sửa `gate/gate_1/`, generated API type hoặc logging infrastructure.
- [ ] REQ017 Không còn assumption chưa duyệt trong spec, plan, research, model, contract, task.
- [ ] REQ018 Reviewer đã ghi finding và resolution vào Jira; không còn CRITICAL/HIGH gap.

## Kết luận review

- Reviewer:
- Ngày:
- Jira ticket:
- Commit SHA:
- Kết quả: `PASS` / `FAIL`
- Finding còn lại:
