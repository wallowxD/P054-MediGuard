# Đặc tả sản phẩm và tính năng

`specs/` có hai tầng:

1. **Product baseline:** hành vi và thuật ngữ ổn định, dùng xuyên tính năng.
2. **Feature workspace:** một delivery slice có spec, plan, tasks, data model, contract,
   checklist và quickstart được team review thủ công.

## Baseline sản phẩm

| File | Sở hữu nội dung |
|---|---|
| [product-vision.md](product-vision.md) | Bài toán, người dùng, positioning và nguyên tắc an toàn |
| [app-flow.md](app-flow.md) | Luồng patient, ingestion và professional review |
| [domains.md](domains.md) | Entity, thuật ngữ và RAG boundary |
| [user-roles.md](user-roles.md) | Role, access tier và permission matrix |
| [api-contracts.md](api-contracts.md) | Quy ước API và chỉ mục contract |

Priority và delivery status chỉ nằm trong Jira `VMEC`.

## Không gian tài liệu tính năng

| Workspace | Phạm vi |
|---|---|
| [001-core-interaction-check/](001-core-interaction-check/spec.md) | Core flow tra tương tác có dẫn nguồn cho pilot 50 thuốc |

```text
specs/NNN-feature-name/
├── spec.md          hành vi, lý do, user story và acceptance criteria
├── plan.md          phương án kỹ thuật đã duyệt
├── research.md      quyết định và phương án bị loại
├── data-model.md    entity, relationship và invariant
├── contracts/       API/event/interface contract
├── checklists/      checklist requirement/safety
├── quickstart.md    quy trình acceptance end-to-end
└── tasks.md         task kỹ thuật có traceability
```

Trong một tính năng, `spec.md` sở hữu intent; plan/tasks là artifact dẫn xuất. Pydantic
schema đã implement sở hữu runtime API → sinh OpenAPI → sinh
`frontend/src/lib/api/types.gen.ts`. Không sửa generated type bằng tay.

Thay đổi hành vi phải cập nhật spec trong cùng PR với code. Quyết định khó đảo ngược cần
ADR mới. Khi implementation discovery thay đổi intent, leader duyệt rồi đồng bộ lại spec,
plan, contract, tasks, validation evidence và Jira.
