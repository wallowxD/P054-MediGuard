/**
 * MỘT nguồn sự thật cho phân quyền route.
 *
 * Đừng để danh sách public route tồn tại ở 2 nơi (tên thư mục `(public)` + mảng
 * trong middleware). Thêm route vào `(public)` mà quên cập nhật file này sẽ hỏng
 * IM LẶNG — trang legal bị đá về /signin trong khi sitemap vẫn quảng cáo nó.
 */

export const ROLES = {
  /** Bệnh nhân / người chăm sóc — tra cứu tương tác */
  PATIENT: "PATIENT",
  /** Bác sĩ / dược sĩ — duyệt cảnh báo (human-in-the-loop) */
  PHARMACIST: "PHARMACIST",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Route trong (public) — khách vào được, đã đăng nhập thì đá về dashboard */
export const AUTH_ROUTES = ["/signin", "/signup"];

/**
 * Route trong (public) — ai cũng vào được.
 * "/" là landing page: khách xem được, đã đăng nhập thì proxy đá về dashboard.
 * Đây cũng là nguồn sinh sitemap nên chỉ để route muốn Google index.
 */
export const OPEN_ROUTES = ["/", "/privacy-policy", "/terms-of-service"];

export const PUBLIC_ROUTES = [...AUTH_ROUTES, ...OPEN_ROUTES];

/**
 * Prefix URL thật của khu vực dược sĩ.
 * Route group `(review)` KHÔNG xuất hiện trong URL — nó chỉ nhóm layout.
 * Thứ chặn thật là middleware match theo prefix này.
 */
export const REVIEW_PREFIX = "/review";

/** Neo tới từng section của landing page — dùng cho nav và nút CTA */
export const LANDING_SECTIONS = {
  FEATURES: "#tinh-nang",
  HOW_IT_WORKS: "#cach-hoat-dong",
  CONTACT: "#lien-he",
} as const;

export const ROUTES = {
  HOME: "/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  INTERACTIONS: "/interactions",
  SETTINGS: "/settings",
  REVIEW: "/review",
  REVIEW_QUEUE: "/review/queue",
} as const;
