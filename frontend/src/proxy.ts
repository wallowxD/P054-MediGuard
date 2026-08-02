/**
 * ★ ĐÂY là thứ chặn thật, không phải tên thư mục.
 *
 * ⚠️ Next 16 đổi tên `middleware.ts` → `proxy.ts`. Chức năng y hệt, chỉ đổi tên file
 * (xem node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 * §4.4 của STRUCTURE_TEMPLATE viết cho Next 15 nên vẫn gọi là middleware.ts —
 * đừng tạo lại file đó, Next 16 sẽ cảnh báo deprecated.
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
  PUBLIC_ROUTES,
  REVIEW_PREFIX,
  ROLES,
  ROUTES,
} from "@/constants/routes";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // "/" là landing page cho khách. Đã đăng nhập thì không có lý do xem lại
    // trang giới thiệu → đưa thẳng vào dashboard.
    if (pathname === ROUTES.HOME && token) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, req.url));
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

        // Khu vực dược sĩ — chặn ngay ở edge
        if (pathname.startsWith(REVIEW_PREFIX)) {
          return Boolean(token.user?.roles?.includes(ROLES.PHARMACIST));
        }

        return true;
      },
    },
    pages: { signIn: ROUTES.SIGNIN, error: ROUTES.SIGNIN },
  }
);

export const config = {
  matcher: [
    // ★ Loại trừ MỌI đường dẫn có phần mở rộng (`.*\..*`), không liệt kê từng đuôi.
    //
    //   Matcher gốc trong STRUCTURE_TEMPLATE §4.4 chỉ liệt kê vài đuôi ảnh, nên
    //   bất kỳ file tĩnh nào khác trong public/ đều bị đá về /signin: sitemap.xml,
    //   robots.txt, .webmanifest, .pdf, .json… Googlebot nhận 307 thay vì sitemap
    //   — đúng lỗi mà §4.3 cảnh báo. Liệt kê thủ công thì thêm file mới là quên.
    //
    //   Hệ quả cần biết: route ứng dụng KHÔNG được chứa dấu chấm, nếu không sẽ
    //   lọt khỏi vòng bảo vệ.
    "/((?!api|_next/static|_next/image|_next/data|.*\\..*).*)",
  ],
};
