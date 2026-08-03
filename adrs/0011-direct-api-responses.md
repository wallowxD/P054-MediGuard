# ADR 0011 — API thành công trả payload trực tiếp

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-03

## Bối cảnh

Envelope chung `{ error, message, data }` làm schema lồng không cần thiết, lệch OpenAPI và
bắt frontend viết transform cho từng endpoint.

## Quyết định

Response thành công trả trực tiếp Pydantic payload đã khai báo. Lỗi dùng HTTP status và
typed error body riêng. Backend Pydantic schema sinh OpenAPI; OpenAPI sinh
`frontend/src/lib/api/types.gen.ts`; không sửa generated type bằng tay.

## Hệ quả

- ✅ Contract đơn giản và type generation chính xác.
- ✅ React Query nhận đúng dữ liệu domain.
- ❌ Client cũ dựa trên envelope phải migrate.
