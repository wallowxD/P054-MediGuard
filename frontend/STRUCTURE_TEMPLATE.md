# FE Boilerplate — Structure chuẩn cho dự án có phân quyền

Skeleton dùng để **init dự án FE mới** có 3 tầng truy cập: khách vãng lai, người dùng đã đăng nhập, quản trị viên.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · NextAuth v4 · TanStack Query v5 · Redux Toolkit · axios

---

## 1. Nguyên tắc phân tầng

```
Page/Component  →  queries/*  →  services/*  →  utils/request.ts  →  Backend
                  (React Query)  (HTTP thuần)   (axios + refresh token)
```

- Component **không** import trực tiếp `services/*` — luôn đi qua `queries/*` để có cache, `isLoading`, invalidate.
- `services/*` **không** import React, không chứa hook.
- `store/` chỉ giữ **client state** (trạng thái UI, bộ lọc). Data từ API để React Query giữ, đừng copy sang store.
- Mọi endpoint khai báo trong `constants/api.ts`, không rải string trong code.

---

## 2. Cây thư mục skeleton

`<domain>` = domain nghiệp vụ của dự án (`products`, `orders`, `courses`…).

```
<project>/
├── ci/
│   └── Dockerfile
├── public/
│   ├── icons/
│   ├── images/
│   │   └── logo.png
│   └── robots.txt
│
├── src/
│   ├── app/                                   # Routing layer
│   │   ├── (public)/                          # Không cần đăng nhập
│   │   │   ├── layout.tsx
│   │   │   ├── (auth)/
│   │   │   │   ├── signin/
│   │   │   │   │   ├── layout.tsx             # metadata + noindex
│   │   │   │   │   └── page.tsx
│   │   │   │   └── signup/
│   │   │   │       ├── layout.tsx
│   │   │   │       └── page.tsx
│   │   │   ├── privacy-policy/page.tsx
│   │   │   └── terms-of-service/page.tsx
│   │   │
│   │   ├── (protected)/                       # Cần đăng nhập
│   │   │   ├── layout.tsx                     # AppHeader + BottomNav + Suspense
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── <domain>/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── (admin)/                           # Cần role ADMIN
│   │   │   ├── layout.tsx                     # lớp phòng thủ thứ 2
│   │   │   └── admin/                         # ⬅ prefix /admin thật trong URL
│   │   │       ├── page.tsx
│   │   │       ├── users/page.tsx
│   │   │       └── <domain>/page.tsx
│   │   │
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/route.ts
│   │   │
│   │   ├── lib/                               # Provider của app
│   │   │   ├── next.auth.provider.tsx
│   │   │   └── query.provider.tsx
│   │   │
│   │   ├── layout.tsx                         # Root layout
│   │   ├── page.tsx                           # "/" → redirect theo session
│   │   ├── not-found.tsx
│   │   ├── globals.css
│   │   ├── sitemap.ts
│   │   └── favicon.ico
│   │
│   ├── components/
│   │   ├── ui/                                # Skeleton, TextSkeleton…
│   │   ├── header/
│   │   │   ├── app.header.tsx
│   │   │   └── admin.header.tsx
│   │   ├── navigation/BottomNav.tsx
│   │   ├── cards/StatCard.tsx
│   │   ├── charts/                            # (nếu dự án cần biểu đồ)
│   │   ├── tables/
│   │   ├── <domain>/                          # Component gắn domain
│   │   │   ├── <Domain>Card.tsx
│   │   │   ├── <Domain>TableHeader.tsx
│   │   │   ├── <Domain>TableRow.tsx
│   │   │   └── index.ts                       # barrel export
│   │   ├── PermissionGuard.tsx                # chặn theo quyền ở mức component
│   │   ├── EmptyState.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PaginationControls.tsx
│   │   ├── ThemedTooltip.tsx
│   │   ├── ToastProvider.tsx
│   │   ├── ForgotPasswordModal.tsx
│   │   ├── ResetPasswordModal.tsx
│   │   ├── UpdatePasswordModal.tsx
│   │   └── Enable2FAModal.tsx
│   │
│   ├── config/
│   │   └── seo-config.ts
│   │
│   ├── constants/
│   │   ├── api.ts                             # API_BASE_URL + API_ENDPOINTS
│   │   └── routes.ts                          # PUBLIC_ROUTES, ADMIN_PREFIX, ROLES
│   │
│   ├── context/                               # React Context khác (theme, socket…)
│   │
│   ├── lib/
│   │   └── auth.ts                            # authOptions của NextAuth
│   │
│   ├── queries/                               # React Query hooks
│   │   ├── auth.ts
│   │   ├── <domain>.ts
│   │   ├── utils.ts                           # withApiTransform, isApiSuccess…
│   │   └── index.ts
│   │
│   ├── services/                              # Tầng HTTP thuần
│   │   ├── auth/index.ts
│   │   └── <domain>/index.ts
│   │
│   ├── store/                                 # Redux Toolkit
│   │   ├── index.ts
│   │   ├── StoreProvider.tsx
│   │   ├── hooks.ts
│   │   ├── initialState.ts
│   │   ├── reducers/
│   │   │   ├── <slice>.ts
│   │   │   └── index.ts
│   │   ├── selectors/
│   │   │   ├── <slice>.ts
│   │   │   └── index.ts
│   │   └── types/
│   │       ├── <slice>.ts
│   │       ├── store.ts
│   │       └── index.ts
│   │
│   ├── types/                                 # declare global
│   │   ├── auth.d.ts
│   │   ├── backend.d.ts
│   │   ├── next-auth.d.ts
│   │   ├── dashboard.d.ts
│   │   └── <domain>.d.ts
│   │
│   └── utils/
│       ├── request.ts                         # axios instance + refresh token
│       └── metadata-utils.ts
│
├── middleware.ts
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── .env.example
├── .gitlab-ci.yml
└── package.json
```

---

## 3. Script tạo skeleton

Chạy trong thư mục dự án mới (sau khi `create-next-app`). Đổi `DOMAIN` cho phù hợp:

```bash
#!/usr/bin/env bash
set -e
DOMAIN="products"   # ⬅ đổi tên domain ở đây

mkdir -p \
  ci public/icons public/images \
  "src/app/(public)/(auth)/signin" "src/app/(public)/(auth)/signup" \
  "src/app/(public)/privacy-policy" "src/app/(public)/terms-of-service" \
  "src/app/(protected)/dashboard" "src/app/(protected)/settings" \
  "src/app/(protected)/$DOMAIN/[id]/edit" \
  "src/app/(admin)/admin/users" "src/app/(admin)/admin/$DOMAIN" \
  "src/app/api/auth/[...nextauth]" \
  src/app/lib \
  src/components/ui src/components/header src/components/navigation \
  src/components/cards src/components/tables "src/components/$DOMAIN" \
  src/config src/constants src/context src/lib \
  src/queries "src/services/auth" "src/services/$DOMAIN" \
  src/store/reducers src/store/selectors src/store/types \
  src/types src/utils

# File giữ chỗ để git track thư mục rỗng
find src -type d -empty -exec touch {}/.gitkeep \;
echo "✅ Skeleton created (domain: $DOMAIN)"
```

---

## 4. Phân quyền — phần quan trọng nhất

### 4.1 Ba route group theo tầng truy cập

| Group | URL | Ai vào được | Layout làm gì |
|---|---|---|---|
| `(public)` | `/signin`, `/privacy-policy`… | Mọi người | Không check session |
| `(protected)` | `/dashboard`, `/<domain>`… | Đã đăng nhập | Header + nav |
| `(admin)` | `/admin/**` | Role `ADMIN` | Header admin + check role (lớp 2) |

Chia theo **tầng truy cập**, không chia theo từng role. Xem §4.5.

### 4.2 Route group KHÔNG phải security boundary

Đây là hiểu lầm phổ biến nhất. Tên thư mục `(admin)` **không chặn ai cả** — nó chỉ nhóm route để dùng chung layout, và không xuất hiện trong URL. Thứ thực sự chặn là `middleware.ts`.

Hệ quả nếu chỉ dựa vào layout client-side để chặn admin:
1. Middleware cho qua vì user có token hợp lệ
2. Server render page admin, gửi bundle JS admin về client
3. Hydrate xong `useEffect` mới chạy → mới redirect

→ Flash UI admin, và request API trong page đã kịp bắn đi.

**Cách làm đúng: chặn ở edge (middleware), trước khi render.** Vì `(admin)` bọc thư mục `admin/` nên URL vẫn có prefix `/admin` thật — middleware match được bằng prefix.

### 4.3 `src/constants/routes.ts` — một nguồn sự thật

Đừng để danh sách public route tồn tại ở 2 nơi (tên thư mục + mảng trong middleware). Thêm route vào `(public)` mà quên cập nhật middleware sẽ hỏng im lặng — trang legal bị đá về `/signin` dù sitemap vẫn quảng cáo nó với Google.

```ts
// src/constants/routes.ts
export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

/** Route trong (public) — khách vào được, đã đăng nhập thì đá về dashboard */
export const AUTH_ROUTES = ["/signin", "/signup"];

/** Route trong (public) — ai cũng vào được, kể cả đã đăng nhập */
export const OPEN_ROUTES = ["/privacy-policy", "/terms-of-service"];

export const PUBLIC_ROUTES = [...AUTH_ROUTES, ...OPEN_ROUTES];

export const ADMIN_PREFIX = "/admin";

export const ROUTES = {
  HOME: "/",
  SIGNIN: "/signin",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
} as const;
```

> Tách `AUTH_ROUTES` khỏi `OPEN_ROUTES` vì hai nhóm hành xử khác nhau: user đã đăng nhập vào `/signin` thì nên đá về dashboard, nhưng vào `/privacy-policy` thì phải xem được bình thường.

### 4.4 `middleware.ts`

```ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  ADMIN_PREFIX,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  ROLES,
  ROUTES,
} from "@/constants/routes";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // "/" → điều hướng theo trạng thái đăng nhập
    if (pathname === ROUTES.HOME) {
      return NextResponse.redirect(
        new URL(token ? ROUTES.DASHBOARD : ROUTES.SIGNIN, req.url)
      );
    }

    // Đã đăng nhập mà vào signin/signup → về dashboard
    if (AUTH_ROUTES.includes(pathname) && token) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        if (pathname === ROUTES.HOME || PUBLIC_ROUTES.includes(pathname)) {
          return true;
        }
        if (!token) return false;

        // Chặn admin ngay ở edge, TRƯỚC khi render page
        if (pathname.startsWith(ADMIN_PREFIX)) {
          return !!token.user?.roles?.includes(ROLES.ADMIN);
        }

        return true;
      },
    },
    pages: { signIn: ROUTES.SIGNIN, error: ROUTES.SIGNIN },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)",
  ],
};
```

Để `token.user.roles` tồn tại, `roles` phải được đưa vào JWT trong callback của NextAuth (§5.11) và khai báo trong `types/next-auth.d.ts`.

### 4.5 Khi có nhiều hơn 2 role

Chia folder theo **tầng truy cập** thì bền. Chia folder theo **từng role** thì không — thêm `STAFF`, `MODERATOR`, `PARTNER` là folder nhân lên, và route mà 2 role cùng vào được sẽ không biết đặt ở đâu.

**Ngưỡng: từ 3 role trở lên**, giữ nguyên 3 group ở trên, phân quyền mịn hơn thì dùng guard ở mức component:

```tsx
// src/components/PermissionGuard.tsx
"use client";

import { useSession } from "next-auth/react";

interface PermissionGuardProps {
  roles: string[];              // cần một trong các role này
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGuard({
  roles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { data: session } = useSession();
  const userRoles = session?.user?.roles ?? [];
  const allowed = roles.some((r) => userRoles.includes(r));

  return <>{allowed ? children : fallback}</>;
}
```

```tsx
<PermissionGuard roles={[ROLES.ADMIN, "MODERATOR"]}>
  <button onClick={handleDelete}>Xoá</button>
</PermissionGuard>
```

Đừng biểu diễn ma trận quyền bằng cấu trúc thư mục.

### 4.6 Ba lớp phòng thủ

| Lớp | Ở đâu | Vai trò |
|---|---|---|
| 1. Middleware | `middleware.ts` | Chặn thật, chạy ở edge trước khi render |
| 2. Layout | `(admin)/layout.tsx` | Dự phòng khi matcher đổi hoặc route mới quên khai báo |
| 3. Backend | API | **Bắt buộc.** Lớp duy nhất không bypass được |

⚠️ Chặn ở FE chỉ là **UX** — giấu nút, tránh vào nhầm trang. Người dùng luôn có thể gọi thẳng API bằng token của họ. **Backend phải enforce quyền cho mọi endpoint**, không có ngoại lệ.

---

## 5. File mẫu từng tầng

### 5.1 `src/constants/api.ts`

```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

if (!API_BASE_URL && typeof window === "undefined") {
  console.warn("⚠️ NEXT_PUBLIC_API_BASE_URL is not set!");
}

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/tokens",
    REFRESH_TOKEN: "/auth/tokens",
    GOOGLE: "/auth/tokens/google",
    RECOVERY_PASSWORD: "/auth/password",
    RESET_PASSWORD: "/auth/password",
    UPDATE_PASSWORD: "/auth/password",
    GET_PROFILE: "/auth/profiles",
    ACTIVATE_2FA: "/auth/profiles/2fa",
    VERIFY_2FA: "/auth/profiles/2fa",
    DEACTIVATE_2FA: "/auth/profiles/2fa",
  },

  PRODUCTS: {
    GET_ALL: "/products",
    GET_DETAILS: (id: string) => `/products/${id}`,
    CREATE: "/products",
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },

  ADMIN: {
    GET_USERS: "/admin/users",
    UPDATE_USER: (id: string) => `/admin/users/${id}`,
  },
} as const;
```

### 5.2 `src/services/<domain>/index.ts`

Một file cho một domain, đặt tên hàm `<verb><Noun>Request`.

```ts
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import clientRequest from "@/utils/request";

export const getProductsRequest = async (
  params: IProductsGetAllRequest
): Promise<IProductsGetAllResponse> => {
  try {
    const apiUrl = API_BASE_URL + API_ENDPOINTS.PRODUCTS.GET_ALL;
    const retrieved = await clientRequest.get(apiUrl, { params });
    return retrieved?.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An error occurred";
    throw new Error(message);
  }
};

export const getProductDetailsRequest = async (
  id: string
): Promise<IProductsGetDetailsResponse> => {
  try {
    const apiUrl = API_BASE_URL + API_ENDPOINTS.PRODUCTS.GET_DETAILS(id);
    const retrieved = await clientRequest.get(apiUrl);
    return retrieved?.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An error occurred";
    throw new Error(message);
  }
};

export const createProductRequest = async (
  data: ICreateProductRequest
): Promise<ICreateProductResponse> => {
  try {
    const apiUrl = API_BASE_URL + API_ENDPOINTS.PRODUCTS.CREATE;
    const retrieved = await clientRequest.post(apiUrl, data);
    return retrieved?.data;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An error occurred";
    throw new Error(message);
  }
};
```

### 5.3 `src/queries/<domain>.ts`

Mỗi domain: **key factory + queries + mutations**, mutation tự invalidate.

```ts
import {
  createProductRequest,
  getProductDetailsRequest,
  getProductsRequest,
} from "@/services/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { withApiTransform } from "./utils";

// Query Keys
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: IProductsGetAllRequest) =>
    [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Queries
export const useProducts = (
  params: IProductsGetAllRequest,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: withApiTransform(() => getProductsRequest(params)),
    enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

export const useProduct = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: withApiTransform(() => getProductDetailsRequest(id)),
    enabled: enabled && !!id,
  });
};

// Mutations
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ICreateProductRequest) => createProductRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
```

Nhờ key phân cấp: `invalidateQueries({ queryKey: productKeys.all })` xoá sạch cache domain, `productKeys.lists()` chỉ động tới danh sách.

### 5.4 `src/queries/utils.ts`

Giả định backend trả `{ error, message, data }` với `error === 0` là thành công — helper bóc `data` ra và ném lỗi khi thất bại.

```ts
export const isApiSuccess = <T>(res: IApiResponse<T>) => res?.error === 0;

export const getApiErrorMessage = <T>(res: IApiResponse<T>) =>
  res?.message || "An error occurred";

export const transformApiResponse = <T>(res: IApiResponse<T>): T => {
  if (!isApiSuccess(res)) throw new Error(getApiErrorMessage(res));
  return res.data;
};

// Bọc queryFn để hook nhận thẳng data đã bóc
export const withApiTransform =
  <T>(fn: () => Promise<IApiResponse<T>>) =>
  async (): Promise<T> =>
    transformApiResponse(await fn());
```

### 5.5 `src/utils/request.ts` — axios + refresh token

Điểm quan trọng nhất của boilerplate: chống refresh song song + cooldown, thất bại thì `signOut`.

```ts
import { refreshTokenRequest } from "@/queries/auth";
import axios from "axios";
import { getSession, signIn, signOut } from "next-auth/react";

let isRefreshing = false;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 5000;
let refreshPromise: Promise<boolean> | null = null;

const clientRequest = axios.create({
  responseType: "json",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// Request: gắn access token từ session NextAuth
clientRequest.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response: 401 → refresh → retry; nhiều request 401 cùng lúc chỉ refresh 1 lần
clientRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    if (Date.now() - lastRefreshAttempt < REFRESH_COOLDOWN) {
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      lastRefreshAttempt = Date.now();
      refreshPromise = refreshTokenAndUpdateSession().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const ok = await refreshPromise;
    if (!ok) {
      await signOut({ redirect: true, callbackUrl: "/signin" });
      return Promise.reject(error);
    }
    return clientRequest(originalRequest);
  }
);

export default clientRequest;
```

### 5.6 `src/store/` — Redux Toolkit

Cấu trúc 4 phần: `reducers/` · `selectors/` · `types/` · `initialState.ts`.

```ts
// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, useStore } from "react-redux";
import rootReducer from "./reducers";

export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false }),
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
```

```tsx
// src/store/StoreProvider.tsx
"use client";
import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, AppStore } from "./index";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) storeRef.current = makeStore();
  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

### 5.7 `src/types/<domain>.d.ts`

Pattern `declare global` — dùng được mọi nơi không cần import.

```ts
export {};

declare global {
  interface IProductItem {
    id: number;
    name: string;
    price: number;
    status: string;
    createdAt: string;
  }

  interface IProductsGetAllRequest {
    page?: number;
    size?: number;
    keyword?: string;
  }

  interface IProductsGetAllResponse {
    error: number;
    message: string;
    items: IProductItem[];
    metadata: IPaginationMetadata;
  }
}
```

`src/types/backend.d.ts` giữ các kiểu dùng chung: `IApiResponse<T>`, `IPaginationMetadata`.

### 5.8 `src/app/layout.tsx` — root layout

Thứ tự provider: `StoreProvider → QueryProvider → NextAuthProvider`.

```tsx
import ToastProvider from "@/components/ToastProvider";
import StoreProvider from "@/store/StoreProvider";
import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "./lib/next.auth.provider";
import { QueryProvider } from "./lib/query.provider";

const font = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-app",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_NEXTAUTH_URL || "http://localhost:3000"),
  title: { default: "App Name", template: "%s | App Name" },
  description: "…",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <StoreProvider>
      <QueryProvider>
        <NextAuthProvider>
          <html lang="vi" className={font.variable}>
            <body suppressHydrationWarning className={font.className}>
              {children}
              <ToastProvider />
            </body>
          </html>
        </NextAuthProvider>
      </QueryProvider>
    </StoreProvider>
  );
}
```

### 5.9 `src/app/(protected)/layout.tsx`

```tsx
"use client";

import { AppHeader } from "@/components/header/app.header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Suspense } from "react";
import "../globals.css";

// Middleware lo phần auth — vào được đây nghĩa là đã đăng nhập
export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense
      fallback={
        <div className="antialiased min-h-screen bg-background text-foreground">
          <AppHeader />
          <main className="p-4 sm:p-6 pb-20 lg:pb-6">
            <div className="flex items-center justify-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          </main>
          <BottomNav />
        </div>
      }
    >
      <div className="antialiased min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="p-4 sm:p-6 pb-20 lg:pb-6">{children}</main>
        <BottomNav />
      </div>
    </Suspense>
  );
}
```

### 5.10 `src/app/(admin)/layout.tsx`

Middleware đã chặn ở edge — layout này là **lớp phòng thủ thứ hai**.

```tsx
"use client";

import { AdminHeader } from "@/components/header/admin.header";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ROLES, ROUTES } from "@/constants/routes";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import "../globals.css";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.roles?.includes(ROLES.ADMIN);

  useEffect(() => {
    if (status === "authenticated" && !isAdmin) router.push(ROUTES.DASHBOARD);
  }, [status, isAdmin, router]);

  if (status === "authenticated" && !isAdmin) return null;

  return (
    <LoadingOverlay>
      <div className="antialiased min-h-screen bg-background text-foreground">
        <AdminHeader />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </LoadingOverlay>
  );
}
```

### 5.11 `src/lib/auth.ts` — đưa `roles` vào JWT

Middleware chỉ đọc được `roles` nếu nó nằm trong token.

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.accessToken = user.accessToken;
      token.refreshToken = user.refreshToken;
      token.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles ?? [],   // ⬅ bắt buộc
      };
    }
    return token;
  },
  async session({ session, token }) {
    session.accessToken = token.accessToken as string;
    session.user = token.user as typeof session.user;
    return session;
  },
},
```

```ts
// src/types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name: string; roles: string[] };
    accessToken: string;
    refreshToken?: string;
    error?: string;
  }
  interface User extends DefaultUser {
    accessToken: string;
    refreshToken: string;
    roles: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    user?: { id: string; email: string; name: string; roles: string[] };
    error?: string;
  }
}
```

### 5.12 `next.config.ts`

```ts
import type { NextConfig } from "next";
import { API_BASE_URL } from "./src/constants/api";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },
  async rewrites() {
    if (!API_BASE_URL) return [];
    return [
      { source: "/api/external/:path*", destination: `${API_BASE_URL}/:path*` },
    ];
  },
};

export default nextConfig;
```

---

## 6. `package.json` mẫu

```json
{
  "name": "<project-name>",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint"
  },
  "dependencies": {
    "@reduxjs/toolkit": "^2.11.2",
    "@tanstack/react-query": "^5.90.3",
    "@tanstack/react-query-devtools": "^5.87.3",
    "axios": "^1.12.2",
    "lucide-react": "^0.542.0",
    "next": "15.5.9",
    "next-auth": "^4.24.13",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-hook-form": "^7.62.0",
    "react-loading-skeleton": "^3.5.0",
    "react-redux": "^9.2.0",
    "react-toastify": "^11.0.5",
    "react-tooltip": "^5.29.1"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.9",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

**Thêm khi cần (không mặc định):** `apexcharts` + `react-apexcharts` (biểu đồ) · `qrcode.react` (QR 2FA) · `react-joyride` (onboarding tour) · `react-syntax-highlighter` (hiển thị code) · `@heroicons/react` · `next-themes`.

---

## 7. `.env.example`

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=development

# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# NextAuth  (secret: openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Google OAuth (bỏ nếu không dùng)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

⚠️ Biến `NEXT_PUBLIC_*` bị **nhúng cứng vào bundle lúc build** → phải truyền qua `ARG` trong Dockerfile, đổi giá trị là phải build lại. Secret **không bao giờ** đặt tiền tố `NEXT_PUBLIC_`.

---

## 8. Theme — `globals.css` + `tailwind.config.ts`

Khai báo **CSS variables** trong `globals.css`, map sang Tailwind token. Đổi màu chỉ sửa 1 chỗ.

```css
/* src/app/globals.css — palette trung tính, đổi theo brand của dự án */
@import "tailwindcss";

:root {
  --background: #0B0D10;
  --background-elevated: #12151A;
  --surface: rgba(255, 255, 255, 0.04);
  --card: #161A20;
  --foreground: #FFFFFF;
  --foreground-secondary: #A3ABB8;
  --foreground-muted: #6B7280;
  --primary: #3B82F6;
  --primary-hover: #2563EB;
  --primary-foreground: #FFFFFF;
  --success: #22C55E;
  --error: #EF4444;
  --warning: #F59E0B;
  --border: rgba(255, 255, 255, 0.12);
  --input: #10141A;
  --ring: #3B82F6;
}
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-elevated": "var(--background-elevated)",
        surface: "var(--surface)",
        card: "var(--card)",
        foreground: "var(--foreground)",
        "foreground-secondary": "var(--foreground-secondary)",
        "foreground-muted": "var(--foreground-muted)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-foreground": "var(--primary-foreground)",
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 9. Quy ước đặt tên

| Đối tượng | Quy ước | Ví dụ |
|---|---|---|
| Thư mục | `kebab-case` | `api-management/`, `sub-accounts/` |
| Component | `PascalCase.tsx` | `ProductCard.tsx`, `EmptyState.tsx` |
| Header / Provider | `dot.case.tsx` | `app.header.tsx`, `query.provider.tsx` |
| Config / util | `kebab-case.ts` | `seo-config.ts`, `metadata-utils.ts` |
| Service | thư mục + `index.ts`, hàm `<verb><Noun>Request` | `getProductsRequest` |
| Query hook | `use<Noun>` / `use<Verb><Noun>` | `useProducts`, `useCreateProduct` |
| Query key | `<domain>Keys` | `productKeys` |
| Interface | prefix `I` | `IProductItem`, `ICreateProductRequest` |
| Hằng số | `SCREAMING_SNAKE_CASE` | `API_ENDPOINTS`, `PUBLIC_ROUTES` |

Chọn **một** quy ước cho mỗi loại và giữ nhất quán toàn repo — đừng để `ProductCard.tsx` sống cạnh `product.card.tsx`.

---

## 10. Thêm một tính năng mới — làm đúng thứ tự

```
1. src/constants/api.ts                → thêm endpoint
2. src/types/<domain>.d.ts             → interface request/response
3. src/services/<domain>/index.ts      → hàm *Request
4. src/queries/<domain>.ts             → key factory + hook
5. src/components/<domain>/            → UI tái sử dụng + index.ts
6. src/app/(protected)/<route>/page.tsx → ráp lại
7. src/constants/routes.ts             → đăng ký route nếu là public/admin
```

---

## 11. Checklist init dự án mới

**Nền tảng**
- [ ] `npx create-next-app@latest --typescript --tailwind --app --src-dir`
- [ ] Chạy script §3, đổi `DOMAIN`
- [ ] `tsconfig.json`: `strict: true` + alias `"@/*": ["./src/*"]`
- [ ] Đặt CSS variables trong `globals.css` + map `tailwind.config.ts`

**Hạ tầng data**
- [ ] Copy `constants/api.ts`, `utils/request.ts`, `queries/utils.ts`, `store/*`
- [ ] Copy `app/lib/query.provider.tsx` + `next.auth.provider.tsx`, ráp vào root layout

**Phân quyền**
- [ ] `constants/routes.ts` khai báo `PUBLIC_ROUTES`, `ADMIN_PREFIX`, `ROLES`
- [ ] `lib/auth.ts` đưa `roles` vào JWT callback
- [ ] `types/next-auth.d.ts` khai báo `roles` cho `Session` / `User` / `JWT`
- [ ] `middleware.ts` check role admin ở edge
- [ ] Xác nhận **backend đã enforce quyền** cho mọi endpoint admin

**Hoàn thiện**
- [ ] Tạo `.env` từ `.env.example`, sinh `NEXTAUTH_SECRET`
- [ ] `public/robots.txt`: `Disallow` mọi route sau đăng nhập; `app/sitemap.ts` chỉ liệt kê route trong `(public)`
- [ ] Đổi `metadata` trong root layout + `config/seo-config.ts`
- [ ] `.gitlab-ci.yml` + `ci/Dockerfile`: cập nhật tên container, port, domain

---

## 12. Lỗi cần tránh

1. **Tưởng route group là security boundary** — tên thư mục không chặn ai. Middleware mới chặn.
2. **Danh sách public route bị duplicate** — thư mục `(public)` và mảng trong middleware phải cùng một nguồn (`constants/routes.ts`). Quên đồng bộ là trang legal bị đá về `/signin` trong khi sitemap vẫn quảng cáo nó với Google.
3. **Chỉ chặn admin ở client layout** — user thường vẫn tải được bundle admin và bắn được request trước khi redirect.
4. **Hai tầng HTTP song song** — chỉ giữ `utils/request.ts`, đừng tạo thêm helper fetch riêng.
5. **Page quá dài** — vượt ~250 dòng thì tách component con.
6. **Mock data nằm thẳng trong page** — để riêng `*.mock.ts` và gắn `// TODO: nối API`.
7. **Copy data API vào Redux** — hai nguồn sự thật, lệch lúc nào không hay.
8. **Tài liệu lệch với code** — sửa cấu trúc thì cập nhật doc trong cùng PR.
