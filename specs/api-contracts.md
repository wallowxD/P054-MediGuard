# Quy ước API contract

## Nguồn sự thật

```text
Pydantic schema + FastAPI route
→ generated OpenAPI
→ frontend/src/lib/api/types.gen.ts
→ frontend service/query/component
```

Không sửa `types.gen.ts` bằng tay và không tạo handwritten type trùng generated contract.

## Quy ước phản hồi

- Success trả typed payload trực tiếp theo ADR 0011.
- Error dùng HTTP status phù hợp và typed error body.
- Warning item bắt buộc có citation list không rỗng.
- Missing/invalid evidence nằm trong structured `unavailable`, không dùng
  `severity: unknown` thay thế.
- `pending` và `approved` có thể trả cho patient; `rejected` bị loại ở backend.

## Chỉ mục contract

| Tính năng | Contract |
|---|---|
| Core interaction check | `specs/001-core-interaction-check/contracts/interaction-check.openapi.yaml` |

Khi đổi endpoint/schema: cập nhật spec/contract → Pydantic/router → sinh OpenAPI và
frontend types → cập nhật service/query → chạy integration tests và frontend build.
