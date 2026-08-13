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
| `src/app/(public)/` | Trang chủ Vinmec, màn tính năng, sign-in/sign-up và legal page |
| `src/app/(protected)/` | Dashboard, interaction lookup, settings cho user đã đăng nhập |
| `src/app/(review)/` | Review queue cho role `PHARMACIST` dưới `/review` |
| `src/proxy.ts` | Access gate thật chạy tại edge |
| `src/constants/` | Endpoint, route và role constant |
| `src/services/` | HTTP function thuần, không React/hook |
| `src/queries/` | Query key, React Query hook và invalidation |
| `src/store/` | Chỉ client state như filter và drug basket |
| `src/components/landing/` | Section của màn tính năng (`/tinh-nang`) — hero, feature card, CTA. `LandingHeader`/`LandingFooter` trong thư mục này KHÔNG còn được render, xem ghi chú ở đầu `(public)/tinh-nang/page.tsx` |
| `src/components/vinmec/` | Cổng Vinmec: header, footer, hero và các section của trang chủ (`/`) |
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

```
1. constants/api.ts                 → khai báo endpoint
2. types/<domain>.d.ts              → interface request/response
3. services/<domain>/index.ts       → hàm *Request
4. queries/<domain>.ts              → key factory + hook
5. components/<domain>/             → UI tái sử dụng + index.ts
6. app/(protected)/<route>/page.tsx → ráp trang
7. constants/routes.ts              → đăng ký route nếu public hoặc review
```

## Bản đồ route công khai

| URL | Nội dung | File |
|---|---|---|
| `/` | Trang chủ Vinmec — cổng bệnh viện, nội dung tĩnh | `app/(public)/page.tsx` |
| `/tinh-nang` | Màn tra cứu an toàn thuốc, vào từ mục "Tính năng" trên nav | `app/(public)/tinh-nang/page.tsx` |
| `/privacy-policy`, `/terms-of-service` | Trang pháp lý | `app/(public)/…` |

Hai trang đầu **từng ngược nhau** (`/` là màn tra cứu, `/vinmec` là cổng). Route `/vinmec`
đã bị gỡ và nay trả 404 — xem `GONE_ROUTES` trong `constants/routes.ts`. Link cũ trỏ `/`
giờ ra cổng bệnh viện chứ không còn ra màn tra cứu, kiểm lại trước khi copy link cũ.

Người đã đăng nhập vẫn xem được `/`; `src/proxy.ts` cố ý không đá họ về dashboard nữa.

## Hệ thống thị giác (màn tính năng)

Đây là nguồn sự thật cho toàn team về màu sắc của màn tính năng (`/tinh-nang`).
Phần implementation nằm ở `frontend/src/app/globals.css`; nếu đổi giá trị palette, cập nhật
bảng này và token CSS trong cùng một pull request.

### Bảng màu thương hiệu — màn tính năng nền sáng

| Token | Hex | Dùng cho |
|---|---|---|
| `background`, card | `#FFFFFF` | Nền chính và bề mặt card |
| `background-elevated` | `#F5F8FC` | Section nền sáng xen kẽ và nền footer |
| `surface` | `#F1F5FB` | Chip và bề mặt UI phụ, tông nhẹ |
| `foreground`, `primary` | `#1B3155` | Text thương hiệu, heading, nút chính và focus ring |
| `primary-hover` | `color-mix(primary 82%, black)` | Trạng thái hover cho action màu navy — tính toán qua `color-mix`, không chọn tay một hex riêng |
| `foreground-secondary` | `#44546F` | Nội dung thân bài |
| `foreground-muted` | `#64748B` | Metadata và nhãn ít quan trọng |
| `border` | `#E6EAF0` | Đường viền mảnh và divider tiết chế |
| `hero-tint` | `#EAF1FB` | Điểm bắt đầu gradient hero và vòng tròn icon |
| `hero-tint-mid` | `#F0F5FF` | Điểm giữa gradient hero |
| `hero-tint-soft` | `#F5F9FF` | Điểm kết gradient CTA và nền tông nhẹ |
| `primary-blue` | `#4B7FC3` | Màu xanh tương tác duy nhất của màn tính năng — CTA hero, CTA `CtaBand`, nav link đang active |
| `coral` | `#F28C78` | Điểm nhấn minh hoạ ấm, chỉ dùng nhỏ (hiện chưa dùng, giữ chỗ dự phòng) |
| `cta-accent` | `#4B7FC3` (= `primary-blue`) | CTA hero, CTA `CtaBand` và nav link active. Không dùng cho gì khác. |
| `cta-accent-hover` | `color-mix(primary-blue 78%, black)` | Trạng thái hover cho `cta-accent` |

### Typography (kiểu chữ)

**Toàn site dùng đúng MỘT font: Inter.** Tiêu đề, thân bài, nút, nav — tất cả cùng một
font family. Không có font serif cho heading, không có display font riêng cho hero.

Đây không phải lựa chọn thẩm mỹ tuỳ hứng mà là để khớp trang chủ Vinmec. CSS gốc của
Vinmec (`/css/reset.css`) đặt:

```css
html,
body {
  font-family: "Inter", "roboto", Arial, Helvetica, sans-serif;
}
```

và **không** khai báo font nào khác cho `h1`–`h6`. Giao diện của mình đứng cạnh cổng
Vinmec trong cùng một luồng, nên lệch font là lộ ngay.

| Dùng cho | Font | Áp dụng qua |
|---|---|---|
| Mọi text trong app | Inter | `font-sans` — mặc định, **hiếm khi phải khai báo tay** |
| Tiêu đề | Inter | `font-heading` (xem lưu ý bên dưới) |

#### `font-heading` hiện bằng hệt `font-sans`

`font-heading` vẫn tồn tại và vẫn dùng được, nhưng nó **không còn là một font khác**:

```css
/* globals.css */
@theme inline {
  --font-sans: var(--font-body);
  --font-heading: var(--font-body); /* ← cùng một font */
}
```

Giữ lại utility này vì hai lý do: nó ghi lại ý định "đây là tiêu đề" ngay trong markup, và
nếu sau này team muốn tiêu đề đổi font thì **chỉ sửa một dòng** thay vì đi sửa 14 file.
Đừng nhìn thấy `font-heading` rồi tưởng đang có font tiêu đề riêng.

#### Cân nặng (weight)

Inter được nạp ở dạng **variable font**, có sẵn dải 100–900, đúng như Vinmec nạp
(`family=Inter:wght@100..900`). Nghĩa là:

- Cứ dùng thẳng `font-medium`, `font-semibold`, `font-bold`… không phải khai báo trước.
- **Không** thêm mảng `weight` vào `Inter()` trong `app/layout.tsx`. Thêm vào là khoá lại
  đúng vài weight đó, và mọi weight khác sẽ bị trình duyệt giả lập (faux bold) — chữ dày
  bệt, xấu, mà không có lỗi nào báo.

Thang weight đang dùng trong dự án: `font-medium` (500) cho nhãn/nav, `font-semibold` (600)
cho tiêu đề và nút, `font-bold` (700) khi thật sự cần nhấn mạnh.

#### Quy tắc bắt buộc

- **Không** thêm font family thứ hai. Muốn phân cấp thị giác thì đổi **cỡ chữ, weight, màu**
  — đừng đổi font.
- **Không** khai báo `fontFamily` inline trong component. Trước đây `HeroSection.tsx` từng
  làm vậy để dùng Roboto riêng cho `<h1>`; pattern đó đã bị gỡ, đừng dựng lại.
- **Không** thêm instance `next/font/google` ở component. Font chỉ được đăng ký một chỗ duy
  nhất: `src/app/layout.tsx`.
- Cần một cỡ chữ mà Tailwind không có (ví dụ `clamp()` co giãn theo viewport) thì chỉ đặt
  `fontSize` inline, giữ nguyên font family kế thừa.

Muốn đổi font cho toàn site (kể cả quay về hai-font): sửa `interFont` trong
`src/app/layout.tsx` và hai dòng `--font-*` trong `globals.css`. Đó là toàn bộ điểm chạm.

### Màu ngữ nghĩa (semantic colours)

Màu ngữ nghĩa biểu thị trạng thái; đây không phải màu thương hiệu thay thế.

| Token | Giá trị (light) | Ý nghĩa |
|---|---|---|
| `success` | `#16A34A` | Thao tác thành công hoặc trạng thái tích cực đã xác nhận |
| `error` | `#DC2626` | Thao tác thất bại hoặc input không hợp lệ |
| `warning` | `#D97706` | UI cảnh báo và banner an toàn tham khảo |
| `info` | `#2563EB` | Trạng thái thông tin |
| `severity-contraindicated` | `#B91C1C` | Mức độ tương tác chống chỉ định |
| `severity-major` | `#EA580C` | Mức độ tương tác nghiêm trọng |
| `severity-moderate` | `#D97706` | Mức độ tương tác trung bình |
| `severity-minor` | `#0891B2` | Mức độ tương tác nhẹ |
| `severity-unknown` | `#64748B` | Chưa xác định mức độ |

### Button dùng chung — `components/ui/Button.tsx`

Toàn site chỉ dùng một component `Button`. Không tự viết `<button>`/`<Link>` style riêng lẻ
trùng chức năng — nếu chưa có variant phù hợp thì thêm variant mới, không viết tay.

| Variant | Hình thức | Dùng cho |
|---|---|---|
| `solid` | Nền navy, chữ trắng | Action chính mặc định ở mọi nơi ngoài hero landing (ví dụ CTA của feature card) |
| `outline` | Chỉ viền, hover ra navy | Action phụ đi kèm một nút `solid` hoặc `accent` |
| `ghost` | Chỉ có chữ | Action phụ, mức nhấn thấp |
| `accent` | Nền xanh (`cta-accent`), chữ trắng | CTA của hero và CTA cuối `CtaBand`. Không dùng cho chỗ khác — xem quy tắc màu bên dưới |

| Size | Hình thức | Dùng cho |
|---|---|---|
| `sm` | Padding gọn, `text-sm` | Nút trong header, nút trong drawer mobile |
| `md` (mặc định) | Padding chuẩn, `text-sm` | Đa số nút |
| `lg` | Padding rộng, `text-base` | Một CTA nổi bật duy nhất — hiện chỉ dùng ở `CtaBand`. Đừng dùng size này chỉ để nút "trông quan trọng hơn"; ưu tiên tạo hierarchy thật (cỡ heading, spacing) trước |

### Class CSS chỉ dùng cho landing (`globals.css`)

Các class này chỉ tồn tại trong `.landing-theme` (trang marketing công khai) và đọc biến CSS
riêng của theme đó, không phải token `:root` toàn site. Không tái sử dụng ngoài `(public)/`.

| Class | Vai trò |
|---|---|
| `landing-hero-gradient` | Nền gradient dọc của hero (`hero-tint` → `hero-tint-mid` → trắng) |
| `landing-hero-texture` | Lưới chấm mờ ở góc xa của hero — thuần CSS `radial-gradient`, không dùng ảnh |
| `landing-cta-gradient` | Nền cho `CtaBand` ở cuối trang |
| `landing-footer-wash` | Nền cho `LandingFooter` |
| `landing-primary-shadow` | Shadow phối màu cho nút variant `solid` |
| `landing-cta-shadow` | Shadow phối màu cho nút variant `accent` — bám theo `cta-accent`, tự đổi màu nếu token đó thay đổi |
| `landing-pill-shadow` | Bóng đổ tông navy nhẹ dưới ảnh viên nang của hero |
| `landing-feature-card` / `landing-icon-shadow` | Shadow tông navy rất nhẹ cho card trong `FeaturesSection` và badge icon — viền (`border-border`) tạo cạnh card, shadow chỉ nâng card lên vài px |
| `landing-wide-container` | Dùng chung cho `LandingHeader` và `HeroSection` để hai phần thẳng hàng mép-đến-mép. Dưới `lg` là `max-w-6xl` + `px-4`/`sm:px-6` như bình thường. Từ `lg` trở lên đổi thành `max-width: min(1600px, calc(100vw - 96px))`, không padding inline, để màn hình lớn có hero thật sự rộng thay vì bị ghim ở 1152px. Nếu thêm section landing full-bleed mới cần thẳng hàng với hero/nav, tái dùng class này thay vì `max-w-6xl` |
| `landing-reveal` (qua component `Reveal`) | Hiệu ứng fade/slide khi cuộn tới; tắt về static khi `prefers-reduced-motion` và `@media (scripting: none)` |

### Pattern của `LandingHeader`

`LandingHeader` là một card bo tròn nổi (floating), không phải thanh full-width — đây là lựa
chọn cố ý, khác với thanh sticky phẳng phần còn lại của app hay dùng. Nếu chỉnh sửa:

- `<header>` ngoài cùng là wrapper sticky trong suốt; card hiển thị là `<div>` bên trong
  (`rounded-full`, border, `shadow-sm`/`shadow-md` tuỳ trạng thái `scrolled`).
- Chỉ chuyển thành `rounded-[28px]` khi drawer mobile (`open`) đang mở — không áp radius này
  cho nav desktop.
- Nav link active được đánh dấu bằng `border-b-2 border-[var(--cta-accent)]`, cùng màu với
  CTA hero — đây là nơi duy nhất khác được phép dùng `cta-accent`.
- **Mục nav nào đang active do scroll spy quyết định, không hardcode.** `useSectionSpy`
  (`components/landing/use-section-spy.ts`) dùng `IntersectionObserver` với vạch đọc
  `-45% 0px -50% 0px`: section nào chiếm khoảng giữa viewport thì mục nav tương ứng sáng
  underline và mang `aria-current="page"`. Nav desktop và drawer mobile đọc chung một
  `activeId` nên không thể lệch nhau. Không thêm listener `scroll` để tính lại việc này —
  observer đã đủ và rẻ hơn nhiều.
- Mỗi mục nav phải có một section mang đúng `id` khai báo trong `LANDING_SECTIONS`
  (`#trang-chu` là hero, `#lien-he` là `LandingFooter`). Thêm mục nav mà quên gắn `id` thì
  link vẫn cuộn được nhưng underline không bao giờ sáng.
- Bấm nav link sẽ `preventDefault` rồi tự cuộn (có bù `HEADER_OFFSET` và tôn trọng
  `prefers-reduced-motion`) để active state đổi ngay thay vì nhảy qua từng section trung
  gian trong lúc cuộn mượt. `href` vẫn là neo thật để link hoạt động khi JS chưa chạy.
- **Nav đầy đủ (link giữa + action bên phải) chỉ hiện từ `lg:` (1024px), không phải `md:`
  (768px).** Đây là chủ đích, không phải thiếu sót: ở 768px không đủ chỗ cho logo, 5 link nav
  và action bên phải trên một dòng, chúng sẽ bị xuống dòng. Nếu thêm nav item mới, kiểm tra lại
  ở cả 768px và 1024px trước khi ship — đừng chỉ nhìn ở 1440px.

### Chiều cao Hero — hero chiếm trọn viewport đầu tiên

Ở `lg` trở lên, hero cao đúng phần viewport còn lại dưới `LandingHeader`, để màn hình đầu
tiên chỉ có nav và hero — section "Tính năng" không được ló ra đáy màn hình khi chưa cuộn.
Logic nằm ở class `.landing-hero-viewport` trong `globals.css`, không phải utility trong JSX,
vì cần hai dòng `min-height` (fallback `vh` rồi `dvh`) mà arbitrary value của Tailwind không
diễn đạt được.

```
min-height: calc(100dvh - var(--landing-header-block));   /* --landing-header-block = 4rem + 2px */
```

Ba điều dễ làm sai khi chỉnh:

- **Chỉ trừ `--landing-header-block`, không trừ thêm `--landing-header-offset`.** Header
  chiếm trong luồng đúng chiều cao card (h-16 + 2 đường viền 1px); `top-3/top-4` chỉ là vị trí
  sticky, ở scroll 0 nó đẩy card xuống và card đè lên padding trên của hero. Trừ thêm 1rem nữa
  là chừa lại đúng 1rem cho mép "Tính năng" lộ ra — quay lại đúng lỗi ban đầu.
- **`min-height`, không phải `height`.** Màn hình thấp thì hero phải dài ra được; đặt `height`
  sẽ cắt mất headline/CTA/disclaimer.
- **Chỉ áp từ `lg`.** Dưới `lg` hero cao theo nội dung; ép full-screen trên điện thoại chỉ tạo
  overflow chứ không đẹp hơn.

`min-height` và `lg:items-center` phải nằm trên **cùng một** element (grid
`.landing-wide-container` bên trong `HeroSection`), không tách ra giữa `<section>` và phần tử
con. Đặt `min-height` ở `<section>` rồi `height: 100%` + `items-center` ở grid con nhìn tương
đương nhưng không đáng tin cậy — việc resolve percentage-height dựa trên parent có `min-height`
khá mong manh, kết quả là nội dung bị dồn lên trên với khoảng trống lệch phía dưới thay vì được
căn giữa.

### Ảnh minh hoạ Hero

Ảnh viên nang của hero nằm ở `frontend/public/pill-render.png` (1448×1086), dùng thẻ `<img>`
thường (không phải `next/image`) vì đây là asset trang trí, nền trong suốt, tràn ra ngoài nền
chứ không phải ảnh nội dung cần crop/tối ưu. `yarn lint` sẽ cảnh báo việc này — cảnh báo đó là
dự tính, không cần sửa.

Ở `lg`, ảnh dùng `lg:w-auto lg:max-w-[min(100%,38rem)]` cộng `max-height` từ class
`.landing-hero-figure` (chỗ trống thật còn lại sau header, phần sticky đè lên và `lg:py-12`).
Chỉ đặt trần chứ không đặt `height`: với thẻ ảnh, trình duyệt tự co cả hai chiều theo đúng tỉ
lệ gốc khi vướng `max-width`/`max-height`, nên ảnh nhỏ lại chứ không méo và không bị crop. Từ
1366×768 trở lên trần này chưa chạm tới — nó chỉ có tác dụng trên laptop màn hình rất thấp.

### Quy tắc màu sắc và thị giác

- Dùng theme utility như `bg-primary`, `text-foreground-secondary`, `bg-hero-tint`,
  `border-border`; không paste hex ở các bảng trên thẳng vào JSX/TSX.
- Navy là màu thương hiệu chính của MediGuard. Không hồi sinh palette teal/green cũ.
- Green chỉ dùng cho trạng thái success. Coral chỉ là điểm nhấn minh hoạ tiết chế; không phải
  màu CTA và không được dùng để biểu thị severity.
- `cta-accent` chỉ dành cho CTA chính của hero, CTA của `CtaBand`, và nav link đang active.
  Không tái sử dụng cho chỗ khác. Đây là alias của `primary-blue`, không phải một tông màu
  thứ hai — giữ nguyên như vậy thay vì thêm một sắc xanh thứ ba vào palette.
- Nhịp spacing dọc của màn tính năng là `py-20 sm:py-24` (khoảng 80–96px) cho các section nội
  dung đầy đủ (`FeaturesSection`, `HowItWorksSection`); `CtaBand` và `LandingFooter` chặt hơn vì
  là band, không phải content section. Ưu tiên tăng padding *bên trong* card/band thay vì tăng
  khoảng trống *giữa* các section — khi phân vân, trang nên đọc như "có padding", không phải
  "quá dài".
- Landing page công khai luôn ở chế độ sáng kể cả khi hệ điều hành ưu tiên dark mode. Màn hình
  đã đăng nhập vẫn hỗ trợ đầy đủ token dark vì dark mode là tiêu chí chấm điểm.
- Giữ gradient tông thấp (low-chroma): hero `#EAF1FB` → `#F0F5FF` → trắng; CTA `#EAF1FB` →
  `#F5F9FF`. Không đưa gradient neon, rainbow, hoặc kiểu "AI purple–blue" vào, và không dùng
  section marketing nền tối.
- Màu severity chỉ mang tính trình bày. Frontend không tự suy ra severity từ màu; nó render
  đúng giá trị mà backend domain layer trả về.

## Ràng buộc khi viết code

- Strict TypeScript; alias `@/*` trỏ tới `./src/*`.
- Business endpoint trả direct typed payload theo ADR 0011; không thêm envelope hoặc
  transform unwrap riêng.
- Service scaffold đang dùng `apiNotReady()` cho router backend chưa có. Chỉ bật request
  thật khi backend contract tương ứng đã implement, đi theo từng TODO trong file service.
- `src/lib/api/types.gen.ts` là type **GENERATED** từ `openapi.json` — không sửa tay. Khi
  file này đã tồn tại, đối chiếu với `src/types/*.d.ts` (hiện đang viết tay) và xoá phần
  trùng lặp.
- Dark mode, responsive và keyboard accessibility là acceptance requirement, đồng thời là
  **tiêu chí chấm điểm**. Ngoại lệ duy nhất là trang công khai — giao diện thương hiệu
  MediGuard của trang này chủ đích chỉ có chế độ sáng.
- Severity phải có text/icon; không truyền đạt chỉ bằng màu.
- Warning phải hiển thị quote, source và review status đầy đủ.
- `pending` vẫn hiển thị ngay, kèm `PendingReviewNotice` — không chỉ một nhãn text nhỏ.
  `rejected` không hiển thị: `InteractionCard` và `InteractionTableRow` đều gọi
  `isRejectedForPatient()` làm chốt chặn runtime, kể cả khi type đã loại `"rejected"`.
- Nhãn của `interaction.management` là **"Nội dung trong tài liệu nguồn"**, không phải
  "Xử trí". Đây là nội dung chép lại từ tờ HDSD, không phải hướng xử trí cho ca cụ thể;
  wording mang tính chỉ định điều trị vi phạm nguyên tắc "không kết luận lâm sàng".
- Text có nghĩa phải đạt WCAG AA 4.5:1. `--foreground-muted` đã đổi từ `#94a3b8` (2.56:1
  trên nền trắng) sang `#64748b` ở light và `#9ca3af` ở dark; đừng làm nhạt lại. Nếu cần
  text mờ hơn nữa trên nền `surface`, dùng `foreground-secondary` thay vì hạ token.
- Vùng chạm của icon-only button tối thiểu 24×24 CSS px, ưu tiên 32–44px. Đặt kích thước
  bằng `h-*/w-*` + flex centering, không dựa vào `p-0.5` quanh icon 12px.
- Mọi layout có chrome cố định phải có `SkipLink`; `<main>` tương ứng mang
  `id={MAIN_CONTENT_ID}` và `tabIndex={-1}`. Hiện có ở `(public)` và `(protected)`;
  `(review)` chưa có.
- `Modal` (`components/ui/Modal.tsx`) là nơi duy nhất cài focus trap, Escape, khoá scroll
  nền và trả focus về trigger. Đừng viết overlay dialog riêng — thêm prop vào đây.
- Giữ `output: "standalone"` trong `next.config.ts` vì Docker image phụ thuộc output này.
- `NEXT_PUBLIC_*` được đóng vào bundle lúc build; Docker truyền qua `build.args`.
- Application route không được chứa dấu chấm vì proxy matcher loại path có extension.

---

## Quyết định không hiển nhiên

Project này được scaffold từ một frontend boilerplate viết cho **Next 15 + Tailwind v3**.
Boilerplate đó không còn nằm trong repository, nhưng đã định hình cấu trúc hiện tại, và một
số chỗ cố ý khác đi so với nó. Nếu thấy gì đó không theo convention quen thuộc, thường là vì
lý do dưới đây:

| Convention chỗ khác | Ở đây | Vì sao |
|---|---|---|
| `middleware.ts` | `src/proxy.ts` | Next.js 16 đổi tên convention |
| `tailwind.config.ts` | token qua `@theme` trong `globals.css` | Tailwind v4 không cần JS config cũ |
| `useRef` cho store tạo một lần | `useState(makeStore)` | Tránh vi phạm React 19 refs rule |
| Provider bọc `<html>` | Provider nằm trong `<body>` | Root layout cần `<html>/<body>` ở root |
| Matcher liệt kê extension | Loại mọi path có extension | Không redirect sitemap, robots, manifest, PDF |
| `/` redirect sign-in | `/` là trang chủ Vinmec công khai | Ai cũng xem được cổng bệnh viện, kể cả khách lẫn người đã đăng nhập |
| `public/robots.txt` cố định | `src/app/robots.ts` | Sinh URL đúng theo deployment |

Chi tiết quyết định tại [ADR 0007](../adrs/0007-frontend-structure-and-auth.md) và
[ADR 0008](../adrs/0008-toolchain-version-pins.md).

## Trạng thái hiện tại

Backend chưa có auth module và business router chưa được bật. Các service liên quan vẫn
gọi `apiNotReady()`; khôi phục function body theo TODO khi backend sẵn sàng. Frontend test
framework chưa được chốt; không tự cài thêm trước khi có Jira decision/ADR phù hợp.

### Màn hình nào đang thật sự dùng được

| Màn | Trạng thái |
|---|---|
| `/drug-information` | Chạy thật — `/drugs`, `/drugs/letters`, `/drugs/search` đã có |
| `/drug-information/[id]` | Chưa có endpoint chi tiết |
| `/interactions`, `/interactions/drug-drug`, `/interactions/drug-food` | `FeatureUnavailable` |
| `/interactions/drug-disease` | `FeatureUnavailable` — chờ VMEC-71 và VMEC-72 |
| `/prescriptions/review` | `FeatureUnavailable` — chưa có upload/OCR |

Ba màn tra cứu tương tác trước đây dựng đủ ô nhập nhưng nút tra cứu disabled vĩnh viễn.
Với sản phẩm cảnh báo an toàn thuốc, một màn tra cứu không bao giờ trả kết quả rất dễ bị
đọc thành "không có tương tác", nên chúng đã đổi sang `components/FeatureUnavailable.tsx`:
nói thẳng là chưa khả dụng, liệt kê phần còn thiếu, và chỉ chứa link tới trang chạy thật.
`PRIMARY_NAV_ITEMS` đánh dấu các mục này `unsupported: true` để sidebar và dashboard hiển
thị badge "Chưa hỗ trợ" khớp với thực tế.

Hệ quả: `DrugCatalogPicker`, `SelectedDrugList`, `BasketInputField`, `OcrCandidateList`,
`OcrProcessingState`, `OcrFailureState`, `InteractionResultsPlaceholder` và Redux slice
`drug-basket` hiện **không được mount ở đâu**. Giữ lại làm scaffold cho lúc backend mở —
xem TODO(API) trong từng file — chứ không phải code chết cần xoá.

`PrescriptionImageUpload` đã bỏ hoàn toàn `<input type="file">`, vùng kéo thả và preview:
chọn được ảnh rồi thấy thumbnail khiến người dùng tin đơn thuốc đã được gửi lên và đang
được AI đọc. Chỉ mở lại các affordance đó cùng lúc với endpoint upload + OCR thật.
