# ADR 0015 — Backend tự sở hữu identity thay vì dùng Supabase Auth

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-04
- **Liên quan:** bổ sung ADR 0013 (Supabase PostgreSQL là relational truth), hiện thực hoá
  phần authorization của ADR 0007

## Bối cảnh

Frontend đã có sẵn `CredentialsProvider` của NextAuth, `types/auth.d.ts` và bảng endpoint
trong `constants/api.ts`, nhưng backend chưa có module auth nên mọi service vẫn gọi
`apiNotReady()`. Project đã tạo Supabase, nên có hai đường đi:

1. Dùng Supabase Auth (GoTrue) làm identity provider; FastAPI proxy lại token của GoTrue.
2. FastAPI sở hữu bảng `users` trong Supabase PostgreSQL và tự phát JWT.

## Quyết định

Chọn phương án 2.

| Thành phần | Lựa chọn |
|---|---|
| Nơi lưu tài khoản | Bảng `public.users` trong Supabase PostgreSQL |
| Băm mật khẩu | Argon2id qua `argon2-cffi` |
| Token | JWT HS256 tự ký, cặp access (30 phút) + refresh (14 ngày) |
| Secret | `JWT_SECRET_KEY` trong `.env` tại repo root |
| Tham số TTL/policy | `backend/config.yaml`, section `auth` |
| Schema migration | Alembic, `backend/migrations/` |

Đăng ký công khai **luôn** tạo role `PATIENT`. `RegisterRequest` không có field `role`;
nâng lên `PHARMACIST` là thao tác thủ công của admin.

Đăng nhập và làm mới token là **hai endpoint riêng**: `POST /api/v1/auth/login` và
`POST /api/v1/auth/refresh`. Bản implementation đầu tiên gộp cả hai vào
`POST /api/v1/auth/tokens` vì `constants/api.ts` trỏ `LOGIN` và `REFRESH_TOKEN` vào cùng
một URL, nhưng cách đó buộc một endpoint phải nhận body dạng union và trả một response
model chung. Tách ra cho phép mỗi luồng có request/response schema riêng, đúng với
`ILoginResponse` (có `user`) và `IRefreshTokenResponse` (không có `user`) mà frontend đã
khai báo sẵn; đổi lại phải cập nhật `constants/api.ts`.

## Lý do

- Backend là security boundary duy nhất theo ADR 0007. Dùng GoTrue tạo hai hệ session song
  song — JWT của NextAuth và JWT của GoTrue — và không rõ hệ nào là nguồn sự thật của
  `roles`.
- Role `PATIENT`/`PHARMACIST` quyết định quyền vào `/review/**`. Chúng thuộc dữ liệu ứng
  dụng, nên vẫn phải nằm trong bảng của ta dù có dùng GoTrue hay không.
- Dev và test chạy được với PostgreSQL trong `docker-compose.yml`; GoTrue thì bắt buộc phải
  có mạng tới Supabase.
- ADR 0013 đã đặt Supabase PostgreSQL làm relational owner. Thêm một bảng không tạo thành
  phần topology mới; thêm GoTrue thì có.

## Hệ quả

- ✅ Một identity, một nguồn sự thật cho `roles`.
- ✅ Contract khớp đúng `frontend/src/types/auth.d.ts` đang có, không phải sửa frontend.
- ✅ Logic auth nằm trong `domain/auth.py`, test được offline hoàn toàn.
- ❌ Xác thực email, quên mật khẩu và MFA phải tự implement; các modal
  `ForgotPasswordModal`, `ResetPasswordModal`, `Enable2FAModal` ở frontend chưa có backend.
- ❌ Refresh token là stateless: chưa có bảng revoke, nên logout chỉ xoá token phía client
  và refresh token cũ vẫn dùng được tới khi hết hạn. Cần ticket riêng nếu muốn thu hồi
  ngay.
- ❌ Đội tự chịu trách nhiệm về tham số hash và vòng đời token.

## Ràng buộc bắt buộc với Supabase

PostgREST của Supabase expose mọi bảng trong schema `public` qua anon key, mà anon key nằm
công khai trong bundle frontend. Migration `0001` vì vậy bật `ROW LEVEL SECURITY` trên
`users` và **không tạo policy nào**: backend kết nối bằng role sở hữu bảng nên bỏ qua RLS,
còn `anon`/`authenticated` không đọc được dòng nào. Tắt RLS ở bảng này đồng nghĩa công khai
toàn bộ hash mật khẩu.

## Phương án đã xem xét

- **Supabase Auth (GoTrue).** Được sẵn xác thực email, reset password và MFA. Bị loại vì
  hai hệ session song song, vì `roles` vẫn phải nằm ở bảng riêng, và vì dev/test bắt buộc
  online.
- **Session cookie phía server.** Đơn giản hơn JWT nhưng không khớp NextAuth
  `session.strategy = "jwt"` đã chốt ở ADR 0007.
