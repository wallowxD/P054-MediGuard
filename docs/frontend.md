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

## MediGuard visual system

This section is the team-facing source of truth for colour decisions. The implementation lives
in `frontend/src/app/globals.css`; if a palette value changes, update this table and the CSS
tokens in the same pull request.

### Brand palette — light landing page

| Token / role | Hex | Use |
|---|---|---|
| `background`, card | `#FFFFFF` | Main canvas and card surfaces |
| `background-elevated` | `#F5F8FC` | Alternating light sections and footer support |
| `surface` | `#F1F5FB` | Quiet chips and secondary UI surfaces |
| `foreground`, `primary` | `#1B3155` | Brand text, headings, primary buttons and focus rings |
| `primary-hover` | `color-mix(primary 82%, black)` | Hover state for navy actions — derived, not a hand-picked hex |
| `foreground-secondary` | `#44546F` | Body copy |
| `foreground-muted` | `#64748B` | Metadata and low-emphasis labels |
| `border` | `#E6EAF0` | Hairlines and restrained dividers |
| `hero-tint` | `#EAF1FB` | Hero gradient start and icon circles |
| `hero-tint-mid` | `#F0F5FF` | Hero gradient midpoint |
| `hero-tint-soft` | `#F5F9FF` | CTA gradient end and quiet backgrounds |
| `primary-blue` | `#4B7FC3` | The landing page's one interactive blue — hero CTA, final `CtaBand` CTA, active nav link |
| `coral` | `#F28C78` | Small warm illustration accents only (currently unused, kept reserved) |
| `cta-accent` | `#4B7FC3` (= `primary-blue`) | The hero CTA, the `CtaBand` CTA and the active nav link. Nothing else. |
| `cta-accent-hover` | `color-mix(primary-blue 78%, black)` | Hover state for `cta-accent` |

### Typography

| Use | Font | Applied via |
|---|---|---|
| Body text everywhere | Inter | `font-sans` (the default; you rarely need to write it) |
| Headings everywhere **except** the landing hero | Lora | `font-heading`, loaded once in `app/layout.tsx` |
| The landing hero's `<h1>` only | Roboto | see below — **not** `font-heading` |

The hero headline is the one deliberate exception to "one heading font sitewide." It is loaded
as a component-local `next/font/google` instance inside `HeroSection.tsx` (`variable:
"--font-hero-display"`), applied via `style={{ fontFamily: "var(--font-hero-display)" }}` on
the `<h1>` only. It is **not** registered in `app/layout.tsx` and does not touch `font-heading`,
so every other heading on the site keeps Lora. If you need another one-off display font for a
single section, copy this pattern (component-scoped `variable`, inline `fontFamily`) rather than
changing the global `font-heading` — that would silently restyle every other page.

### Semantic colours

Semantic colours communicate state; they are not alternative brand colours.

| Token | Light value | Meaning |
|---|---|---|
| `success` | `#16A34A` | Successful operation or confirmed positive status |
| `error` | `#DC2626` | Failed operation or invalid input |
| `warning` | `#D97706` | Cautionary UI and the reference-safety notice |
| `info` | `#2563EB` | Informational state |
| `severity-contraindicated` | `#B91C1C` | Contraindicated interaction severity |
| `severity-major` | `#EA580C` | Major interaction severity |
| `severity-moderate` | `#D97706` | Moderate interaction severity |
| `severity-minor` | `#0891B2` | Minor interaction severity |
| `severity-unknown` | `#64748B` | Unknown interaction severity |

### Buttons — `components/ui/Button.tsx`

One shared `Button` for the whole site. Never write a one-off styled `<button>` or `<Link>`
that duplicates it — add a variant instead if none fits.

| Variant | Look | Use for |
|---|---|---|
| `solid` | Navy fill, white text | The default primary action anywhere outside the landing hero (e.g. feature-card CTAs) |
| `outline` | Border only, navy on hover | Secondary actions next to a `solid` or `accent` button |
| `ghost` | Text only | Low-emphasis inline actions |
| `accent` | Blue fill (`cta-accent`), white text | The hero CTA and the final `CtaBand` CTA. Do not use it for anything else — see the colour rule below |

| Size | Look | Use for |
|---|---|---|
| `sm` | Compact padding, `text-sm` | Header buttons, mobile drawer buttons |
| `md` (default) | Standard padding, `text-sm` | Most buttons |
| `lg` | Generous padding, `text-base` | A single standout CTA — currently only `CtaBand`. Don't reach for it just to make a button "feel more important"; add real hierarchy (heading size, spacing) first |

### Landing-only utility classes (`globals.css`)

These exist only inside `.landing-theme` (the public marketing page) and read from its
CSS variables, not the site-wide `:root` tokens. Don't reuse them outside `(public)/`.

| Class | Purpose |
|---|---|
| `landing-hero-gradient` | The hero's vertical background wash (`hero-tint` → `hero-tint-mid` → white) |
| `landing-hero-texture` | The faint dot-grid in the hero's far corners — pure CSS `radial-gradient`, no image |
| `landing-cta-gradient` | Background for the bottom-of-page `CtaBand` |
| `landing-footer-wash` | Background for `LandingFooter` |
| `landing-primary-shadow` | Tinted shadow for `solid`-variant buttons |
| `landing-cta-shadow` | Tinted shadow for `accent`-variant buttons — follows `cta-accent`, so it re-colours automatically if that token ever changes |
| `landing-pill-shadow` | Soft navy-tinted ground shadow under the hero's pill render |
| `landing-feature-card` / `landing-icon-shadow` | Deliberately light navy-tinted shadows for `FeaturesSection` cards and their icon badges — the border (`border-border`) carries the card edge, the shadow just lifts it a few px |
| `landing-wide-container` | Shared by `LandingHeader` and `HeroSection` so both align edge-to-edge. Below `lg` it's `max-w-6xl` + the usual `px-4`/`sm:px-6`. From `lg` up it becomes `max-width: min(1600px, calc(100vw - 96px))` with no inline padding, so large desktops get a genuinely wide hero instead of staying pinned at 1152px. If you add a new full-bleed landing section that should align with the hero/nav, reuse this class rather than `max-w-6xl` |
| `landing-reveal` (via the `Reveal` component) | Scroll-in fade/slide; degrades to static under `prefers-reduced-motion` and `@media (scripting: none)` |

### Landing header pattern

`LandingHeader` is a floating rounded card, not a full-width bar — this is a deliberate
departure from the plain sticky bar most of the rest of the app would use. If you touch it:

- The outer `<header>` is a transparent sticky wrapper; the visible card is the inner `<div>`
  (`rounded-full`, border, `shadow-sm`/`shadow-md` depending on `scrolled` state).
- It morphs to `rounded-[28px]` only while the mobile drawer (`open`) is expanded — don't apply
  that radius change to the desktop nav.
- The active nav link is indicated with `border-b-2 border-[var(--cta-accent)]`, matching the
  hero CTA's colour — that's the only other place `cta-accent` is allowed to appear.
- **The full nav (centered links + right-hand actions) only shows at `lg:` (1024px), not `md:`
  (768px).** This was deliberate, not an oversight: at 768px there isn't enough room for the
  logo, five nav links and the right-hand actions on one line, and they wrap to a second line.
  If you add another nav item, re-check this at 768px and 1024px before shipping — don't just
  eyeball 1440px.

### Hero vertical centering — a gotcha if you touch it

The hero's `lg:min-h-[clamp(620px,70vh,820px)]` and `lg:items-center` both live on the
**same** element (the `.landing-wide-container` grid inside `HeroSection`), not split
between the `<section>` and a child. Putting `min-height` on the `<section>` and
`height: 100%` + `items-center` on the grid child looks equivalent but isn't reliable —
percentage-height resolution against a `min-height`d parent is fragile, and content ends up
top-aligned with a lopsided gap below it instead of centered. If you need to adjust the
hero's height or centering, keep both on the same element.

### Hero art

The hero's pill render lives at `frontend/public/pill-render.png` and is a plain `<img>` (not
`next/image`) because it's a decorative, transparent-background bleed-over-background asset,
not a content photo needing crop/optimisation. `yarn lint` will warn about this — that warning
is expected and can stay.

### Rules for implementation and AI-assisted coding

- Use theme utilities such as `bg-primary`, `text-foreground-secondary`, `bg-hero-tint` and
  `border-border`; never paste the hex values above into JSX or TSX.
- Navy is the primary MediGuard brand colour. Do not revive the old teal/green palette.
- Green is only for semantic success. Coral is only a restrained illustration accent; it is
  not a CTA colour and must not encode severity.
- `cta-accent` is reserved for the hero's primary CTA, the final `CtaBand` CTA, and the active
  landing-nav link. Do not reuse it for anything else. It is an alias for `primary-blue`, not a
  second hue — keep it that way rather than introducing a third shade of blue into the palette.
- Section vertical rhythm on the landing page is `py-20 sm:py-24` (roughly 80–96px) for full
  sections (`FeaturesSection`, `HowItWorksSection`); `CtaBand` and `LandingFooter` are tighter
  since they're bands, not content sections. Favor padding *inside* a card/band over adding
  more space *between* sections — the page reads as padded, not tall, when in doubt.
- The public landing page is intentionally light even when the operating system prefers dark
  mode. Authenticated screens still support the dark token set because dark mode is graded.
- Keep gradients low-chroma: hero `#EAF1FB` → `#F0F5FF` → white; CTA `#EAF1FB` → `#F5F9FF`.
  Do not introduce neon, rainbow, purple–blue AI gradients or dark marketing sections.
- Severity colour is presentation only. The frontend never infers severity from colour; it
  renders the value supplied by the backend domain layer.

### Adding a feature — in this order

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

- `src/lib/api/types.gen.ts` is **GENERATED** from `openapi.json` — never edit it by hand.
  Once it exists, reconcile `src/types/*.d.ts` (currently hand-written) and delete the
  duplicates.
- The backend API **does not exist yet**: function bodies in `services/*` are commented out
  and call `apiNotReady()`. Restore them, following each TODO, as the backend enables the
  matching router.
- The `{ error, message, data }` envelope in `types/backend.d.ts` is **unconfirmed** —
  FastAPI returns payloads directly by default. See open question Q1 in
  [`planning/backlog.md`](../planning/backlog.md).
- Dark mode and responsiveness are **grading criteria**, not nice-to-haves. The exception is
  the public landing page, whose MediGuard brand treatment is intentionally light-only.
- Strict TypeScript. Alias `@/*` → `./src/*`.
- Keep `output: "standalone"` in `next.config.ts` — the Docker build depends on it.
- `NEXT_PUBLIC_*` variables are baked into the bundle at build time, not read at runtime. To
  change one in Docker, edit `build.args` in `docker-compose.yml`, not `environment`.
- **Application routes must not contain a dot.** The proxy matcher excludes every path with
  a file extension, so a dotted route would fall outside the protected set.

---

## Non-obvious decisions

This project was scaffolded from a frontend boilerplate written for **Next 15 +
Tailwind v3**. That template is no longer in the repository, but it shaped the structure,
and several places deliberately diverge from it. If something looks unconventional, this is
usually why:

| Convention elsewhere | Here | Why |
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
