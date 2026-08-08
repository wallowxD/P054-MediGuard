# Tài liệu kỹ thuật

`docs/` mô tả cách làm việc với codebase. **Xây gì và tại sao** nằm trong `specs/`; quyết
định kiến trúc nằm trong `adrs/`; delivery status nằm trong Jira `VMEC`.

| File | Nội dung |
|---|---|
| [code-style.md](code-style.md) | Thư viện dùng cho từng trách nhiệm, cách đặt tên và quy ước code |
| [workflow.md](workflow.md) | Workflow Jira + spec/plan/tasks được duyệt + PR gate |
| [ai-development.md](ai-development.md) | Cách cung cấp context và kiểm soát AI agent khi implement |
| [backend.md](backend.md) | Cấu trúc backend, quy ước, lệnh chạy |
| [frontend.md](frontend.md) | Cấu trúc frontend, Yarn 4, Next.js 16 và layering |
| [architecture_diagram.md](architecture_diagram.md) | Sơ đồ hệ thống và data flow |
| [runbook.md](runbook.md) | Cách vận hành và xử lý sự cố |
| [deployment.md](deployment.md) | Triển khai lên VPS: Caddy, HTTPS, biến môi trường production |
| [guide/](guide/) | Technical Guidebook của chương trình — chỉ tham khảo, không sửa |

## Trước khi sửa code

- Mọi thay đổi → đọc [code-style.md](code-style.md).
- Dùng AI agent → đọc [ai-development.md](ai-development.md).
- Backend → đọc [backend.md](backend.md).
- Frontend → đọc [frontend.md](frontend.md).
- Warning path → đọc ADR 0012, 0005 và 0006.

Tài liệu sống đặt trong `docs/`; quyết định và lý do đặt trong ADR. Khi tài liệu lệch code,
sửa cùng pull request với implementation.
