# ADR 0007 — Cấu trúc frontend và phân quyền

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-02

## Quyết định

Dùng Next.js App Router với ba access tier:

| Route group | Quyền |
|---|---|
| `(public)` | Guest |
| `(protected)` | Patient và Pharmacist đã đăng nhập |
| `(review)` | Chỉ Pharmacist |

`frontend/src/proxy.ts` chặn route trước render; layout là backstop; backend luôn là security
boundary bắt buộc. Component lấy server data qua React Query hook, không gọi service trực
tiếp. Redux chỉ giữ client state.

## Hệ quả

- ✅ Routing phản ánh access tier thay vì tạo cây riêng cho từng role.
- ✅ Backend authorization không bị thay bởi UX guard.
- ✅ Data flow frontend có một chiều rõ ràng.
- ❌ Thêm role mới cần rà proxy, layout, permission guard và backend policy.
