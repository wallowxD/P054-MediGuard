# Triển khai lên VPS

Frontend và backend chạy như hai container riêng biệt trên **cùng một VPS**, đứng sau một
reverse proxy Caddy duy nhất. Database dùng Supabase, không chạy Postgres trên VPS.

## Kiến trúc

```text
                    Internet
                       │
              :80 :443 │  (Caddy tự xin chứng chỉ Let's Encrypt)
                       ▼
        ┌──────────────────────────────┐
        │   caddy  (docker container)  │
        └──────────────┬───────────────┘
                       │  tách theo path
         ┌─────────────┴──────────────┐
         │                            │
   /api/v1/*                    mọi path còn lại
   /health                      (gồm /api/auth/*)
   /docs  /openapi.json                │
         │                            │
         ▼                            ▼
  ┌─────────────┐              ┌──────────────┐
  │  backend    │              │  frontend    │
  │  FastAPI    │              │  Next.js     │
  │  :8000      │              │  :3000       │
  └──────┬──────┘              └──────────────┘
         │
         ▼
   Supabase Postgres (ngoài VPS)
```

Trình duyệt chỉ nhìn thấy **một origin duy nhất** `https://<domain>`. Vì frontend gọi API
cùng origin, không có preflight CORS, chỉ cần một chứng chỉ TLS, và Google OAuth chỉ phải
khai một authorized origin.

### Vì sao tách theo `/api/v1/*` chứ không phải `/api/*`

Đây là chi tiết dễ sai nhất của toàn bộ cấu hình. Đường dẫn `/api` bị **chia đôi** giữa hai
service:

| Path | Thuộc về | Khai báo tại |
|---|---|---|
| `/api/v1/*` | FastAPI | [main.py](../backend/src/medsafe/main.py) — `include_router(router, prefix="/api/v1")` |
| `/api/auth/*` | Next.js (NextAuth) | [route.ts](../frontend/src/app/api/auth/%5B...nextauth%5D/route.ts) |
| `/api/external/*` | Next.js (rewrites) | [next.config.ts](../frontend/next.config.ts) |

Nếu Caddy đẩy toàn bộ `/api/*` sang backend thì NextAuth mất route callback và **mọi luồng
đăng nhập chết**. Triệu chứng là 404 do FastAPI trả về, không phải lỗi của next-auth, nên
rất mất thời gian truy nguyên.

## Yêu cầu trên VPS

- Docker Engine kèm plugin `docker compose` v2.
- Cổng 80 và 443 mở trên firewall. Caddy dùng cổng 80 để xác thực ACME, chặn cổng này thì
  không xin được chứng chỉ.
- Bản ghi DNS **A** của domain trỏ đúng IP VPS, và đã propagate. Kiểm tra:
  `dig +short <domain>`.
- RAM tối thiểu ~2 GB: `next build` là bước tốn bộ nhớ nhất.

## Các bước

### 1. Lấy code

```bash
git clone https://github.com/AI20K-Build-Phase-Cohort-3/P-054.git
cd P-054
```

### 2. Tạo `.env` cho production

```bash
cp .env.example .env
```

Đây vẫn là **file `.env` duy nhất**, giống hệt máy local — chỉ khác giá trị. Sửa các biến
sau, thay `medsafe.example.com` bằng domain thật:

```bash
# Deploy
PUBLIC_DOMAIN=medsafe.example.com
ACME_EMAIL=ban@example.com
BIND_HOST=127.0.0.1

# App
APP_ENV=production
CORS_ORIGINS=https://medsafe.example.com

# Frontend — chú ý API_BASE_URL dùng CÙNG origin, không phải :8000
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://medsafe.example.com
NEXT_PUBLIC_API_BASE_URL=https://medsafe.example.com
NEXTAUTH_URL=https://medsafe.example.com
```

Sinh secret mới cho production, **không dùng lại secret của máy local**:

```bash
openssl rand -hex 32      # -> JWT_SECRET_KEY
openssl rand -base64 32   # -> NEXTAUTH_SECRET
```

`BIND_HOST=127.0.0.1` khiến cổng 3000 và 8000 chỉ nghe trên loopback. Caddy vẫn gọi được
qua mạng nội bộ của compose, nhưng từ Internet thì không — nếu để `0.0.0.0`, người ngoài
truy cập thẳng `http://<IP>:8000` và đi vòng qua HTTPS.

### 3. Cập nhật Google OAuth

Google Cloud Console → **Credentials** → OAuth client ID đang dùng → **Authorized
JavaScript origins**, thêm:

```text
https://medsafe.example.com
```

Google Identity Services từ chối mọi origin không phải HTTPS (trừ `localhost`), nên nút
đăng nhập Google không thể hoạt động nếu deploy bằng IP trần.

Giá trị `GOOGLE_OAUTH_CLIENT_ID` (backend verify) và `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
(browser khởi tạo GIS) phải **giống hệt nhau** — xem
[ADR 0016](../adrs/0016-google-oidc-login.md).

### 4. Áp migration

Chạy từ host, không chạy trong container:

```bash
make install
make migrate
```

Kiểm tra `DATABASE_URL` đang trỏ đúng project Supabase trước khi chạy.

### 5. Deploy

```bash
make prod-config    # validate trước — biến thiếu sẽ báo lỗi ngay tại đây
make prod-up
```

Lần đầu mất vài phút vì phải build cả hai image. Caddy xin chứng chỉ tự động trong khoảng
10–30 giây sau khi container chạy.

### 6. Kiểm tra

```bash
curl -I  https://medsafe.example.com/           # 200, frontend
curl -sS https://medsafe.example.com/health     # {"status":"ok","env":"production"}
curl -I  https://medsafe.example.com/api/auth/providers   # 200 từ Next.js, KHÔNG phải 404
```

Lệnh thứ ba là phép thử quan trọng nhất: nó xác nhận Caddy không cướp `/api/*` khỏi
NextAuth.

## Vận hành

| Việc | Lệnh |
|---|---|
| Xem log | `make prod-logs` |
| Cập nhật code | `git pull && make prod-up` |
| Dừng | `make prod-down` |
| Trạng thái | `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps` |

### Đổi biến `NEXT_PUBLIC_*`

Các biến này được **nhúng cứng vào bundle lúc build**, không đọc lúc chạy. Sửa `.env` rồi
restart là vô tác dụng — phải build lại. `make prod-up` đã kèm `--build` nên chạy lại lệnh
đó là đủ.

### Rollback

```bash
git checkout <commit-cũ>
make prod-up
```

Migration không tự động lùi. Nếu commit cũ cần schema cũ, chạy `make migrate-down` thủ công
và kiểm tra kỹ — thao tác này có thể mất dữ liệu.

## Bẫy đã biết

**Đừng chạy `docker compose down -v` trên prod.** Cờ `-v` xoá volume `caddy_data`, tức xoá
luôn chứng chỉ đã cấp. Let's Encrypt giới hạn 5 lần cấp mỗi tuần cho mỗi bộ domain, vượt
hạn là site không có HTTPS cho tới khi hết hạn mức.

**Không đặt tiền tố `NEXT_PUBLIC_` cho secret.** Biến đó nằm trong JavaScript gửi về
browser, ai xem source cũng đọc được.

**Không tạo `frontend/.env` hay `frontend/.env.local`.** Next.js đọc file trong `frontend/`
trước, nên chúng sẽ ghi đè `.env` ở root một cách âm thầm.
[load-root-env.ts](../frontend/load-root-env.ts) in cảnh báo nếu phát hiện, nhưng cảnh báo
dễ trôi mất trong log build.

**Đăng nhập báo "Không thể đăng nhập. Vui lòng thử lại." nhưng backend không ghi log gì.**
Triệu chứng này nghĩa là request chưa từng rời khỏi container frontend. Callback
`authorize()` của NextAuth chạy trong process Next chứ không phải trong trình duyệt, nên
nó không dùng được `NEXT_PUBLIC_API_BASE_URL` — trong container, `localhost:8000` trỏ về
chính frontend. Biến `API_INTERNAL_URL=http://backend:8000` trong
[docker-compose.yml](../docker-compose.yml) xử lý việc này; `API_BASE_URL` trong
[src/constants/api.ts](../frontend/src/constants/api.ts) tự ưu tiên nó khi chạy phía
server. Kiểm tra nhanh:

```bash
docker compose exec frontend sh -c 'echo $API_INTERNAL_URL'   # http://backend:8000
docker compose logs backend | grep auth/login                 # phải thấy request tới
```

**Chứng chỉ không cấp được** thường do một trong ba: DNS chưa trỏ đúng IP, cổng 80 bị
firewall chặn, hoặc `PUBLIC_DOMAIN` sai chính tả. Xem log Caddy:
`make prod-logs` rồi lọc dòng của service `caddy`.

## Còn thiếu

Cấu hình hiện tại đủ để chạy demo và bản thử nghiệm, nhưng chưa có: backup tự động, giám
sát/alerting, CD pipeline, và rate limiting ở tầng proxy. Cần bổ sung trước khi phục vụ
người dùng thật.
