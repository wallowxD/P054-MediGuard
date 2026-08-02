# Frontend — ngữ cảnh bổ sung

> **Nguồn sự thật của dự án là [`../AGENTS.md`](../AGENTS.md) ở repo root.** File này
> chỉ ghi thêm những gì riêng của frontend, không lặp lại và không được mâu thuẫn.

⚠️ Vẫn phải **mở repo ở thư mục gốc `P-054/`**, không mở `frontend/` làm workspace —
hook AI logging dùng đường dẫn tương đối từ root, mở sai chỗ là mất log mà không có
cảnh báo nào.

---

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Đang dùng **Next.js 16** (App Router) + React 19 + Tailwind v4. Khối trên do
`create-next-app` sinh ra — giữ nguyên, vì API Next 16 lệch nhiều so với dữ liệu
huấn luyện của hầu hết model.

---

## Package manager: Yarn 4, không phải npm

Bản yarn được pin ở trường `packageManager` trong `package.json`, lấy qua corepack.

```bash
corepack enable        # một lần cho mỗi máy
```

- ❌ Không `npm install` — sẽ đẻ ra `package-lock.json` chọi nhau với `yarn.lock`.
- ❌ Không `npm i -g yarn` — ra yarn 1.x, sai định dạng lockfile.
- ❌ Không `npx next dev` — npx tải bản `next` khác vào cache tạm, lỗi hiện ra sẽ
  trỏ sai hướng (báo Turbopack không tìm được workspace root, trong khi nguyên nhân
  thật chỉ là thiếu `node_modules`).

`nodeLinker: node-modules` trong `.yarnrc.yml` — cố ý không dùng PnP, để TypeScript
trong VSCode chạy được mà không phải cài SDK riêng.

## Chạy lệnh từ repo root

```bash
make web-install    # yarn install
make web            # dev :3000
make web-build      # next build
make web-lint       # eslint
make dev            # song song với backend :8000
```

## Structure

Dựng theo `STRUCTURE_TEMPLATE.md` (boilerplate FE có phân quyền), domain = `interactions`.

```
Page/Component → queries/* → services/* → utils/request.ts → Backend
                (React Query)  (HTTP thuần)  (axios + refresh token)
```

- Component **không** import thẳng `services/*` — luôn qua `queries/*` để có cache,
  `isLoading`, invalidate.
- `services/*` không import React, không chứa hook.
- `store/` chỉ giữ **client state** (bộ lọc, giỏ thuốc đang chọn). Data từ API để
  React Query giữ, đừng copy sang Redux.
- Mọi endpoint khai báo ở `constants/api.ts`, mọi route ở `constants/routes.ts`.

Ba tầng truy cập: `(public)` · `(protected)` · `(review)` (role `PHARMACIST`, URL `/review`).

### Thêm một tính năng — đúng thứ tự

```
1. constants/api.ts                 → endpoint
2. types/<domain>.d.ts              → interface request/response
3. services/<domain>/index.ts       → hàm *Request
4. queries/<domain>.ts              → key factory + hook
5. components/<domain>/             → UI tái sử dụng + index.ts
6. app/(protected)/<route>/page.tsx → ráp lại
7. constants/routes.ts              → đăng ký nếu là public/review
```

## ⚠️ Chỗ code LỆCH so với STRUCTURE_TEMPLATE.md

Template viết cho **Next 15 + Tailwind v3**. Dự án chạy **Next 16 + Tailwind v4**.
Đây là những chỗ làm khác — làm theo template nguyên văn sẽ hỏng:

| Template (§) | Ở đây | Lý do |
|---|---|---|
| `middleware.ts` (§4.4) | **`src/proxy.ts`** | Next 16 đổi tên middleware → proxy. Chức năng y hệt. Tạo lại `middleware.ts` sẽ bị cảnh báo deprecated |
| `tailwind.config.ts` (§8) | **không có** — token khai báo bằng `@theme` trong `globals.css` | Tailwind v4 bỏ config JS |
| `useRef` trong StoreProvider (§5.6) | **`useState(makeStore)`** | React 19 + rule `react-hooks/refs` báo lỗi "Cannot access refs during render" |
| Provider bọc ngoài `<html>` (§5.8) | Provider đặt **trong `<body>`** | App Router yêu cầu `<html>`/`<body>` là gốc của root layout |
| matcher §4.4 | loại trừ **mọi path có phần mở rộng** (`.*\..*`) | matcher gốc chỉ liệt kê vài đuôi ảnh → `sitemap.xml`, `robots.txt`, `.webmanifest`, `.pdf`… đều bị đá về `/signin`. Hệ quả: route ứng dụng không được chứa dấu chấm |
| `"/"` redirect thẳng về `/signin` §4.4 | `"/"` là **landing page** cho khách; đã đăng nhập mới đá về `/dashboard` | yêu cầu sản phẩm: khách phải xem được trang giới thiệu |
| `public/robots.txt` tĩnh §2 | sinh động ở `src/app/robots.ts` | bản tĩnh hardcode URL sitemap → deploy lên domain thật vẫn trỏ localhost |
| `ci/Dockerfile` + `.gitlab-ci.yml` | **`frontend/Dockerfile`** + GitHub Actions | dự án dùng GitHub, và compose trỏ tới `frontend/Dockerfile` |

Ngoài ra `next.config.ts` phải giữ `output: "standalone"` (template không có) — Dockerfile
phụ thuộc vào nó. Phần còn lại của §5.12 (security headers, `compress`, `rewrites`
`/api/external/*`) giữ nguyên như template.

### Chỗ cố ý KHÔNG làm theo template

| Template | Lý do bỏ |
|---|---|
| `images.remotePatterns` có `lh3.googleusercontent.com` | dự án không dùng Google OAuth; mỗi entry là một lỗ trong allowlist của image optimizer. Để mảng rỗng, thêm khi thật sự cần |
| `(admin)/admin/users/page.tsx` | dược sĩ không quản lý người dùng — ngoài phạm vi PRD |
| `qrcode.react` cho Enable2FAModal | §6 xếp vào nhóm "thêm khi cần"; backend chưa có endpoint 2FA |
| `watch()` trong validate của react-hook-form | React Compiler bỏ qua memoize cả component. Dùng tham số `formValues` của `validate` |

## Ràng buộc khi viết code

- `src/lib/api/types.gen.ts` là file **SINH** từ `openapi.json` — không sửa tay.
  Khi có file này, đối chiếu lại `src/types/*.d.ts` (đang khai báo tay) và bỏ phần trùng.
- API backend **chưa có**: thân hàm trong `services/*` đang comment lại, tạm gọi
  `apiNotReady()`. Mở lại theo TODO khi backend bật router tương ứng.
- Envelope `{ error, message, data }` trong `types/backend.d.ts` **chưa được backend
  xác nhận** — FastAPI mặc định trả thẳng payload. Chốt schema xong thì rà lại
  `queries/utils.ts`.
- Dark mode + responsive là **tiêu chí chấm điểm**, không phải nice-to-have.
- TypeScript strict. Alias `@/*` → `./src/*`.
- `output: "standalone"` trong `next.config.ts` là để build Docker — đừng bỏ.
- Biến `NEXT_PUBLIC_*` nhúng vào bundle lúc build, không đọc lúc chạy. Muốn đổi
  trong Docker thì sửa `build.args` ở `docker-compose.yml`, không phải `environment`.

## Luật sản phẩm vẫn áp dụng ở tầng UI

Mọi cảnh báo tương tác hiển thị **phải kèm đoạn trích nguyên văn + nguồn**, và cảnh
báo chưa được dược sĩ duyệt vẫn hiện ngay kèm nhãn *"chờ xác nhận chuyên môn"* —
không chặn luồng. Chi tiết ba luật: [`../AGENTS.md`](../AGENTS.md).
