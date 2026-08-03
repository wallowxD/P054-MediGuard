# Hướng dẫn phát triển frontend

Frontend dùng Next.js 16 App Router, React 19, strict TypeScript, Tailwind v4 và shadcn/ui.

> Luôn mở repository root `P-054/`, không mở riêng `frontend/`. Thư mục `frontend/` chỉ
> chứa source; tài liệu đặt trong `docs/`.

## Lưu ý về phiên bản

Next.js 16 có thay đổi breaking so với nhiều tài liệu/model cũ. Trước khi dùng API hoặc
convention chưa quen, đọc tài liệu tương ứng tại `frontend/node_modules/next/dist/docs/`
và xử lý deprecation warning. Ví dụ rõ nhất: `middleware.ts` đã đổi thành `proxy.ts`.

## Chạy nhanh

Mọi lệnh chạy từ repository root:

```bash
corepack enable     # một lần trên mỗi máy, dùng Yarn đã pin
make web-install    # yarn install
make web            # dev server: http://localhost:3000
make web-lint       # ESLint
make web-build      # type check + production build
make dev            # frontend :3000 và backend :8000
```

Copy `frontend/.env.example` thành `frontend/.env.local`; tạo `NEXTAUTH_SECRET` bằng
`openssl rand -base64 32` khi chạy ngoài Compose.

## Trình quản lý gói

Project dùng Yarn 4 được pin trong `frontend/package.json` và tải qua Corepack.

- Không dùng `npm install`; nó tạo `package-lock.json` xung đột với `yarn.lock`.
- Không dùng `npm i -g yarn`; lệnh này thường cài Yarn 1.x.
- Không dùng `npx next dev`; npx có thể tải một bản Next khác vào cache tạm.
- `.yarnrc.yml` dùng `nodeLinker: node-modules`; không dùng PnP.

## Luồng dữ liệu và cấu trúc

```text
Page/Component → queries/* → services/* → utils/request.ts → backend
                 React Query  HTTP thuần     axios + refresh token
```

| Path | Trách nhiệm |
|---|---|
| `src/app/(public)/` | Landing, sign-in/sign-up và legal page |
| `src/app/(protected)/` | Dashboard, interaction lookup, settings cho user đã đăng nhập |
| `src/app/(review)/` | Review queue cho role `PHARMACIST` dưới `/review` |
| `src/proxy.ts` | Access gate thật chạy tại edge |
| `src/constants/` | Endpoint, route và role constant |
| `src/services/` | HTTP function thuần, không React/hook |
| `src/queries/` | Query key, React Query hook và invalidation |
| `src/store/` | Chỉ client state như filter và drug basket |
| `src/components/interactions/` | Warning card, severity badge, citation block |
| `src/lib/api/types.gen.ts` | Generated type từ OpenAPI; không sửa tay |

## Quy tắc phân lớp

- Component không import `services/*` trực tiếp; luôn đi qua `queries/*` để có cache,
  loading/error state và invalidation thống nhất.
- `services/*` không import React và không chứa hook.
- API/server state thuộc React Query; không copy sang Redux để tránh hai source of truth.
- Endpoint khai báo tại `constants/api.ts`; route/role tại `constants/routes.ts`.
- Route group `(public)`, `(protected)`, `(review)` chỉ tổ chức file, không phải security
  boundary. `src/proxy.ts` mới thực thi access control.

## Thứ tự thêm feature

1. Leader duyệt `spec.md`, `plan.md` và API contract của feature.
2. Backend implement Pydantic schema và sinh OpenAPI.
3. Sinh lại `src/lib/api/types.gen.ts`; không chỉnh trực tiếp.
4. Thêm endpoint constant tại `constants/api.ts`.
5. Implement request function tại `services/<domain>/index.ts`.
6. Implement query key/hook tại `queries/<domain>.ts`.
7. Tạo component tái sử dụng tại `components/<domain>/`.
8. Compose page trong route group phù hợp.
9. Register route/role nếu thuộc public hoặc review tier.
10. Chạy lint, build và acceptance quickstart.

## Ràng buộc khi viết code

- Strict TypeScript; alias `@/*` trỏ tới `./src/*`.
- Business endpoint trả direct typed payload theo ADR 0011; không thêm envelope hoặc
  transform unwrap riêng.
- Service scaffold đang dùng `apiNotReady()` cho router backend chưa có. Chỉ bật request
  thật khi backend contract tương ứng đã implement.
- Dark mode, responsive và keyboard accessibility là acceptance requirement.
- Severity phải có text/icon; không truyền đạt chỉ bằng màu.
- Warning phải hiển thị quote, source và review status đầy đủ.
- `pending` vẫn hiển thị ngay với nhãn chờ xác nhận chuyên môn; `rejected` không hiển thị.
- Giữ `output: "standalone"` trong `next.config.ts` vì Docker image phụ thuộc output này.
- `NEXT_PUBLIC_*` được đóng vào bundle lúc build; Docker truyền qua `build.args`.
- Application route không được chứa dấu chấm vì proxy matcher loại path có extension.

## Các quy ước dễ nhầm

| Convention phổ biến | Project này | Lý do |
|---|---|---|
| `middleware.ts` | `src/proxy.ts` | Next.js 16 đổi tên convention |
| `tailwind.config.ts` | token qua `@theme` trong `globals.css` | Tailwind v4 không cần JS config cũ |
| `useRef` cho store tạo một lần | `useState(makeStore)` | Tránh vi phạm React 19 refs rule |
| Provider bọc `<html>` | Provider nằm trong `<body>` | Root layout cần `<html>/<body>` ở root |
| Matcher liệt kê extension | Loại mọi path có extension | Không redirect sitemap, robots, manifest, PDF |
| `/` redirect sign-in | `/` là landing page public | Guest phải xem được trang giới thiệu |
| `public/robots.txt` cố định | `src/app/robots.ts` | Sinh URL đúng theo deployment |

Chi tiết quyết định tại [ADR 0007](../adrs/0007-frontend-structure-and-auth.md) và
[ADR 0008](../adrs/0008-toolchain-version-pins.md).

## Trạng thái hiện tại

Backend chưa có auth module và business router chưa được bật. Các service liên quan vẫn
gọi `apiNotReady()`; khôi phục function body theo TODO khi backend sẵn sàng. Frontend test
framework chưa được chốt; không tự cài thêm trước khi có Jira decision/ADR phù hợp.
