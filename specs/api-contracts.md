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
| Auth (đăng ký, token, hồ sơ) | `backend/src/medsafe/schemas/auth.py` → OpenAPI tại `/docs` |

## Auth

| Endpoint | Body | Trả về |
|---|---|---|
| `POST /api/v1/auth/register` | `{email, password, name}` | `201` + `AuthUserResponse` |
| `POST /api/v1/auth/login` | `{email, password}` | `200` + `LoginResponse` |
| `POST /api/v1/auth/google` | `{idToken}` | `200` + `LoginResponse` |
| `POST /api/v1/auth/refresh` | `{refreshToken}` | `200` + `TokenPairResponse` |
| `GET /api/v1/auth/profiles` | — (header `Authorization: Bearer`) | `200` + `AuthUserResponse` |

`LoginResponse` = `{accessToken, refreshToken, expiresIn, user}`.
`TokenPairResponse` = `{accessToken, refreshToken, expiresIn}` — **không có `user`**, vì
lúc refresh client đã có hồ sơ rồi. Hai response model tách bạch để OpenAPI mô tả đúng
từng luồng; khớp `ILoginResponse` và `IRefreshTokenResponse` ở `types/auth.d.ts`.

`/auth/refresh` chỉ nhận token loại `refresh`. Gửi access token vào đây trả `401` —
refresh token sống 14 ngày còn access token sống 30 phút, nhận nhầm loại là kéo dài vòng
đời token bị lộ lên gấp hàng trăm lần.

`register` không nhận field `role`; đăng ký công khai luôn tạo `PATIENT`. Xem
[ADR 0015](../adrs/0015-backend-owned-identity.md).

`/auth/google` nhận `idToken` (Google OpenID Connect ID Token, **không phải** access token
hay authorization code), verify bằng thư viện `google-auth`, rồi trả `LoginResponse` giống
hệt `/auth/login` — client không cần phân biệt hai luồng sau khi đăng nhập xong. Đăng nhập
Google lần đầu luôn tạo user role `PATIENT`. Nếu email Google trùng một local account chưa
liên kết, backend từ chối bằng `409 google_account_conflict` thay vì tự động liên kết — xem
[ADR 0016](../adrs/0016-google-oidc-login.md).

### Error code của auth

| Code | Status | Khi nào |
|---|---|---|
| `password_policy_violation` | 400 | Mật khẩu ngắn hơn `auth.password_min_length`, thiếu chữ hoặc thiếu số |
| `invalid_credentials` | 401 | Sai mật khẩu **hoặc** email không tồn tại — cố ý không phân biệt |
| `invalid_token` | 401 | Thiếu token, token hỏng, hết hạn, hoặc sai loại (dùng refresh thay access) |
| `invalid_google_token` | 401 | Google ID token sai chữ ký, sai `aud`/`iss`, hết hạn, hoặc thiếu `sub` |
| `google_email_not_verified` | 401 | Google trả `email_verified = false` hoặc thiếu `email` |
| `account_inactive` | 403 | `is_active = false` |
| `email_already_registered` | 409 | Email đã có tài khoản (đăng ký email/password) |
| `google_account_conflict` | 409 | Email Google trùng local account nhưng chưa liên kết `oauth_identities` |

Lỗi validate của Pydantic vẫn trả `422` với hình dạng mặc định của FastAPI
(`{detail: [...]}`), không phải `ErrorResponse`.

Khi đổi endpoint/schema: cập nhật spec/contract → Pydantic/router → sinh OpenAPI và
frontend types → cập nhật service/query → chạy integration tests và frontend build.
