/**
 * ★ ĐÂY là thứ chặn thật, không phải tên thư mục.
 *
 * ⚠️ Next 16 renamed `middleware.ts` to `proxy.ts`. Same behaviour, new filename
 * (see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 * Do not recreate `middleware.ts` — Next 16 emits a deprecation warning for it.
 * Background: docs/frontend.md
 *
 * Route group `(review)` KHÔNG chặn ai cả — nó chỉ nhóm route để dùng chung layout
 * và không xuất hiện trong URL. Nếu chỉ dựa vào layout client-side để chặn:
 *   1. middleware cho qua vì token hợp lệ
 *   2. server render page dược sĩ, gửi bundle JS về client
 *   3. hydrate xong useEffect mới chạy → mới redirect
 * → flash UI, và request API trong page đã kịp bắn đi.
 *
 * Vì `(review)` bọc thư mục `review/` nên URL vẫn có prefix /review thật →
 * middleware match được bằng prefix, chặn ngay ở edge TRƯỚC khi render.
 *
 * ⚠️ Chặn ở FE chỉ là UX. Backend PHẢI enforce quyền cho mọi endpoint.
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  AUTH_ROUTES,
  GONE_ROUTES,
  PUBLIC_ROUTES,
  REVIEW_PREFIX,
  ROLES,
  ROUTES,
} from "@/constants/routes";

const dashboardForRoles = (roles: string[] | undefined): string | null => {
  if (roles?.includes(ROLES.PHARMACIST)) return ROUTES.REVIEW;
  if (roles?.includes(ROLES.PATIENT)) return ROUTES.DASHBOARD;
  return null;
};

const isPathWithin = (pathname: string, prefix: string): boolean =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const roles = token?.user?.roles;
    const dashboardRoute = dashboardForRoles(roles);
    const isPharmacist = roles?.includes(ROLES.PHARMACIST) ?? false;

    // ★ "/" KHÔNG còn đá người đã đăng nhập về dashboard.
    //   Trước đây "/" là landing page cho khách, nên đá đi là hợp lý. Từ khi "/" là
    //   trang chủ Vinmec — cổng bệnh viện công khai — thì chặn người đã đăng nhập
    //   xem trang chủ là vô lý; họ tự bấm vào khu vực của mình khi cần.

    // Đã đăng nhập thì không hiển thị lại signin/signup.
    if (AUTH_ROUTES.includes(pathname) && dashboardRoute) {
      return NextResponse.redirect(new URL(dashboardRoute, req.url));
    }

    // Pharmacist/bác sĩ dùng dashboard chuyên môn, không rơi vào dashboard bệnh nhân.
    if (isPathWithin(pathname, ROUTES.DASHBOARD) && isPharmacist) {
      return NextResponse.redirect(new URL(ROUTES.REVIEW, req.url));
    }

    // Patient truy cập URL /review trực tiếp sẽ được đưa về dashboard của mình
    // trước khi trang chuyên môn được render.
    if (isPathWithin(pathname, REVIEW_PREFIX) && dashboardRoute && !isPharmacist) {
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

        // Route đã gỡ: cho đi tiếp để Next trả 404, thay vì đá về /signin khiến
        // người dùng tưởng trang vẫn còn và chỉ thiếu quyền. Xem GONE_ROUTES.
        if (GONE_ROUTES.includes(pathname)) return true;
        if (!token) return false;

        // Chỉ token mang role hợp lệ mới được vào khu protected. Việc đưa user
        // về đúng dashboard và chặn /review theo role nằm ở middleware phía trên.
        return dashboardForRoles(token.user?.roles) !== null;
      },
    },
    pages: { signIn: ROUTES.SIGNIN, error: ROUTES.SIGNIN },
  }
);

export const config = {
  matcher: [
    // ★ Loại trừ MỌI đường dẫn có phần mở rộng (`.*\..*`), không liệt kê từng đuôi.
    //
    //   Liệt kê từng đuôi ảnh là không đủ, nên
    //   bất kỳ file tĩnh nào khác trong public/ đều bị đá về /signin: sitemap.xml,
    //   robots.txt, .webmanifest, .pdf, .json… Googlebot nhận 307 thay vì sitemap
    //   — đúng lỗi mà §4.3 cảnh báo. Liệt kê thủ công thì thêm file mới là quên.
    //
    //   Hệ quả cần biết: route ứng dụng KHÔNG được chứa dấu chấm, nếu không sẽ
    //   lọt khỏi vòng bảo vệ.
    "/((?!api|_next/static|_next/image|_next/data|.*\\..*).*)",
  ],
};
