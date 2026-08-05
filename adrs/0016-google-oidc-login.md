# ADR 0016 — Đăng nhập Google OpenID Connect

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-05
- **Liên quan:** bổ sung ADR 0015 (backend tự sở hữu identity)

## Bối cảnh

ADR 0015 đã chọn để FastAPI tự sở hữu bảng `users` và tự phát JWT thay vì dùng Supabase
Auth. Yêu cầu hiện tại là thêm một đường đăng nhập thứ hai: Google OpenID Connect, để
frontend gửi Google ID Token (không phải authorization code, không xin scope Gmail/Drive)
lên backend đổi lấy token hệ thống — cùng cặp access/refresh token, cùng
`AuthUserResponse` như luồng email/password.

## Quyết định

| Thành phần | Lựa chọn |
|---|---|
| Xác thực token | `google.oauth2.id_token.verify_oauth2_token` (thư viện `google-auth`), không tự decode JWT, không gọi `tokeninfo` |
| Định danh bất biến | Claim `sub`, **không** dùng `email` làm khoá liên kết |
| Nơi lưu tài khoản | Bảng `users` hiện có (không tạo bảng user song song) |
| Liên kết provider | Bảng mới `oauth_identities`, unique `(provider, provider_subject)` |
| Gọi ra ngoài tới Google | Module mới `oauth/google_client.py` — cửa duy nhất, mirror `llm/llm_client.py` |
| Token hệ thống | Tái dùng nguyên `domain.auth.issue_token_pair`/`LoginResponse` — cùng hình dạng với `/auth/login` |

### Tái dùng bảng `users` thay vì tạo bảng riêng

Yêu cầu ban đầu mô tả một model user độc lập (`full_name`, `phone`, `roles` mảng). Bảng
`users` từ ADR 0015 đã có `name` (tương đương `full_name`) và role dạng chuỗi đơn, expose
ra API dưới dạng mảng ở `AuthUserResponse.roles` (xem comment trong `schemas/auth.py`). Tạo
thêm bảng user thứ hai cho Google sẽ nhân đôi khái niệm "tài khoản" và buộc mọi endpoint sau
này (review, prescriptions...) phải biết xử lý hai loại user. Thay vào đó:

- `users.password_hash` chuyển sang **nullable** — tài khoản chỉ đăng nhập Google không có
  mật khẩu nội bộ.
- Không thêm cột `phone` vì chưa có luồng nào dùng tới; thêm khi có yêu cầu thật để tránh
  cột chết.
- Vẫn dùng `role` chuỗi đơn + `self_signup_role` mặc định `PATIENT` từ `config.yaml`,
  giống hệt luồng đăng ký email/password.

### Không tự động liên kết khi email trùng

Nếu email Google đã verified nhưng trùng email một local account **chưa có**
`oauth_identities` tương ứng, backend trả `409 google_account_conflict`, không tự tạo liên
kết. Tự động liên kết theo email là một vector chiếm quyền tài khoản: kẻ tấn công biết email
nạn nhân có thể tạo hoặc dùng một tài khoản Google trùng địa chỉ đó và đăng nhập thẳng vào
tài khoản nội bộ của nạn nhân mà không cần biết mật khẩu. Luồng "link account" cần một bước
xác nhận chủ động (ví dụ: đăng nhập password trước, rồi bấm "liên kết Google" trong khi đã
có session) — chưa nằm trong scope ADR này, cần ticket riêng.

### Vì sao không đặt code trong `domain/`

`domain/auth.py` cấm import provider SDK. Bản thân `verify_oauth2_token` gọi mạng để lấy
public key của Google (có cache), nên không thuần. Phần **thuần** — kiểm `iss`, `sub`,
`email_verified` trên claims đã verify — vẫn nằm trong `domain/auth.py` như một hàm riêng
(`extract_google_identity`), test được offline bằng dict claim giả. Phần gọi mạng nằm ở
`oauth/google_client.py`, module mới cùng cấp với `llm/`, `db/`, `domain/`.

## Hệ quả

- ✅ Một bảng `users`, một response contract (`LoginResponse`) cho mọi luồng đăng nhập.
- ✅ `sub` làm khoá chính tránh account takeover qua đổi chủ email.
- ✅ Lỗi Google tái dùng nguyên `AuthError`/`register_exception_handlers` đã có, không phải
  dựng thêm hạ tầng lỗi mới.
- ❌ `oauth/` là module thứ 13 ở cấp `src/medsafe/`, chưa có trong bảng cấu trúc ở
  `AGENTS.md`/`docs/backend.md` — đã cập nhật hai tài liệu đó trong cùng PR.
- ❌ User có email trùng nhưng đăng nhập Google trước khi có luồng "link account" sẽ bị
  chặn ở bước đăng nhập cho tới khi luồng liên kết được xây (chưa có Jira ticket tại thời
  điểm ADR này được viết).
- ❌ Migration 0003 nới `password_hash` sang nullable; downgrade về NOT NULL sẽ lỗi nếu đã
  có user Google-only trong database — chấp nhận được vì downgrade quá 0002 vốn đã cảnh báo
  không dùng trên database có dữ liệu thật.

## Phương án đã xem xét

- **Tự động liên kết theo email khi đăng nhập Google lần đầu.** Bị loại vì rủi ro account
  takeover mô tả ở trên.
- **Bảng `users` riêng cho Google, dùng chung `oauth_identities` liên kết sang.** Bị loại vì
  nhân đôi khái niệm tài khoản không cần thiết — xem phần "Tái dùng bảng `users`" ở trên.
- **Verify Google token ở NextAuth (frontend), backend chỉ tin JWT do NextAuth ký.** Bị loại
  vì ADR 0007 đã xác định backend luôn là security boundary bắt buộc, không phải proxy của
  Next.js.
