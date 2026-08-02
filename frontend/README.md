# Frontend — Medication Safety Copilot

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4.

> ⚠️ Luôn mở repo ở thư mục gốc `P-054/`, **không** mở `frontend/` làm workspace —
> hook AI logging dùng đường dẫn tương đối từ root, mở sai chỗ là mất log mà không
> có cảnh báo nào. Xem [AGENTS.md](../AGENTS.md).

---

## Chạy nhanh

Mọi lệnh chạy từ **repo root**, không phải từ `frontend/`:

```bash
corepack enable     # một lần cho mỗi máy — lấy đúng Yarn 4 đã pin
make web-install    # yarn install
make web            # dev  -> http://localhost:3000
make web-build      # next build
make web-lint       # eslint
make dev            # song song với backend :8000
```

**Package manager là Yarn 4**, không phải npm. Đừng `npm install` (đẻ ra
`package-lock.json` chọi với `yarn.lock`), đừng `npm i -g yarn` (ra bản 1.x), đừng
`npx next dev` (tải bản `next` khác vào cache tạm rồi báo lỗi trỏ sai hướng).

Biến môi trường: copy `.env.example` → `.env.local`, sinh `NEXTAUTH_SECRET` bằng
`openssl rand -base64 32`.

---

## Cấu trúc

Dựng theo [STRUCTURE_TEMPLATE.md](STRUCTURE_TEMPLATE.md) — boilerplate FE có phân
quyền, domain nghiệp vụ là `interactions`.

```
Page/Component → queries/* → services/* → utils/request.ts → Backend
                (React Query)  (HTTP thuần)  (axios + refresh token)
```

| Thư mục | Việc |
|---|---|
| `src/app/(public)/` | landing page `/`, đăng nhập/đăng ký, trang pháp lý |
| `src/app/(protected)/` | cần đăng nhập — dashboard, tra tương tác, cài đặt |
| `src/app/(review)/` | role `PHARMACIST` — hàng đợi duyệt, URL `/review` |
| `src/proxy.ts` | **chặn thật** ở edge (Next 16 đổi tên từ `middleware.ts`) |
| `src/constants/` | `api.ts` (endpoint) · `routes.ts` (route + role) |
| `src/queries/` · `src/services/` | React Query hooks · tầng HTTP thuần |
| `src/store/` | Redux Toolkit — **chỉ client state**, data API để React Query giữ |
| `src/components/landing/` | các section của trang chủ |
| `src/components/interactions/` | thẻ cảnh báo, badge severity, khối trích dẫn |

**Quy ước, ranh giới và các chỗ lệch so với template: đọc [AGENTS.md](AGENTS.md).**

---

## Trạng thái

Backend chưa có module auth và chưa bật router nghiệp vụ, nên thân hàm trong
`src/services/*` đang comment lại và tạm gọi `apiNotReady()`. Mở lại theo các TODO
khi backend sẵn sàng — xem `backend/src/medsafe/api/routes.py`.
