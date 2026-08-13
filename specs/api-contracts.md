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
| Danh mục thuốc (duyệt A–Z, tìm kiếm) | cùng file trên — `listDrugs`, `searchDrugs` |
| Auth (đăng ký, token, hồ sơ) | `backend/src/medsafe/schemas/auth.py` → OpenAPI tại `/docs` |
| Tra cứu tổng hợp và history | `specs/003-unified-interaction-check/contracts/interaction-check.openapi.yaml` |

## Danh mục thuốc

| Endpoint | Query | Trả về |
|---|---|---|
| `GET /api/v1/drugs` | `letter`, `q`, `page`, `pageSize` | `200` + `DrugListResponse` |
| `GET /api/v1/drugs/letters` | — | `200` + `DrugLetterIndexResponse` |
| `GET /api/v1/drugs/search` | `q`, `limit` | `200` + `DrugSearchResponse` |

Ba endpoint này khác nhau về **cơ chế khớp**, không phải về dữ liệu trả về:

- `/drugs` lọc **tất định** bằng chuỗi con — người dùng đang duyệt danh mục nên phải thấy
  đúng nội dung bảng `drugs`; gõ sai chính tả trả về rỗng chứ không đoán.
- `/drugs/letters` chỉ đếm, không trả nội dung thuốc.
- `/drugs/search` là **autocomplete theo tên biệt dược**: xếp hạng theo bậc tất định
  trước, fuzzy chỉ dùng để bắt lỗi chính tả.

### Xếp hạng của `/drugs/search`

| Bậc | Điểm | Điều kiện |
|---|---|---|
| Khớp tuyệt đối | 100 | Chuỗi chuẩn hoá bằng đúng tên biệt dược hoặc hoạt chất |
| Tiền tố biệt dược | 96 | Tên biệt dược bắt đầu bằng chuỗi người dùng gõ |
| Chuỗi con biệt dược | 93 | Từ 2 ký tự trở lên |
| Chuỗi con hoạt chất | 90 | Từ 2 ký tự trở lên |
| Fuzzy | ≥ 88 | Từ 4 ký tự trở lên, so với **từng token** của tên |

Ràng buộc độ dài không phải để tối ưu tốc độ mà để chặn kết quả rác: `token_set_ratio`
chấm điểm cao bất thường trên chuỗi ngắn — gõ `Ha` từng trả về `Viên Sáng Mắt`. Fuzzy so
với từng token thay vì cả chuỗi vì `fuzz.ratio("panadl", "panadol vien sui")` chỉ đạt
54.5 trong khi so với riêng token `panadol` đạt 92.3; so cả chuỗi thì fuzzy là code chết.

`requiresConfirmation` chỉ bằng `false` khi có **đúng một** ứng viên và ứng viên đó khớp
tuyệt đối. Khớp tiền tố hay chuỗi con không đủ để hệ thống tự chọn hộ — thuốc chọn sai đi
thẳng vào lượt kiểm tra tương tác. Không có ứng viên nào thì cũng là `false` vì không có
gì để xác nhận.

`/drugs/letters` luôn trả **đủ 27 nhóm** A–Z + `other` kể cả nhóm `count = 0`, để FE
disable đúng nút thay vì dẫn người dùng tới trang rỗng. Mỗi `count` bằng đúng `total` mà
`/drugs?letter=` trả về cho cùng chữ cái.

`letter` nhận `A`–`Z` (không phân biệt hoa thường) hoặc `other` cho tên không bắt đầu bằng
chữ cái Latin. **Không dùng ký tự `#`** dù UI hiển thị nhãn đó: `?letter=#` bị trình duyệt
cắt thành fragment nên tham số không bao giờ tới server, và lỗi này im lặng hoàn toàn.

`q` khớp không phân biệt hoa thường và không phân biệt dấu trên tên biệt dược
(`brand_name_unaccent`), khớp trên chuỗi gốc viết thường với hoạt chất. Ký tự `%` và `_`
người dùng nhập được escape, không phải wildcard.

`total` là tổng số dòng khớp bộ lọc, không phải số dòng của trang hiện tại. Trang vượt quá
phạm vi vẫn trả `200` với `items: []` và `total` giữ nguyên.

`DrugListItem` **không có citation** vì danh sách không hiển thị nội dung lâm sàng; nó chỉ
báo `hasLeaflet` để FE biết trang chi tiết có nguồn hay không. Nội dung có dẫn nguồn thuộc
về endpoint chi tiết.

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
