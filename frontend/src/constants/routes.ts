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
 * Route trong (public) — ai cũng vào được, kể cả người đã đăng nhập.
 *
 * "/" là TRANG CHỦ VINMEC (cổng bệnh viện), "/tinh-nang" là màn tra cứu an toàn
 * thuốc. Trước đây hai trang này ngược lại; đổi rồi thì mọi link trỏ "/" đều rơi
 * vào cổng chứ không còn vào màn tính năng nữa.
 *
 * Đây cũng là nguồn sinh sitemap nên chỉ để route muốn Google index.
 */
export const OPEN_ROUTES = [
  "/",
  "/tinh-nang",
  "/ve-vinmec",
  "/privacy-policy",
  "/terms-of-service",
];

export const PUBLIC_ROUTES = [...AUTH_ROUTES, ...OPEN_ROUTES];

/**
 * Route ĐÃ GỠ nhưng từng tồn tại và đã được đẩy lên remote.
 *
 * Middleware từ chối mọi path lạ rồi đá về /signin (deny-by-default). Với một URL
 * đã xoá, hành vi đó gây hiểu nhầm: ai bấm link cũ sẽ tưởng mình thiếu quyền, trong
 * khi thật ra trang không còn nữa. Liệt kê ở đây để middleware cho request đi tiếp
 * và Next trả đúng 404.
 *
 * ⚠️ CHỈ thêm path chắc chắn KHÔNG có route nào. Thêm nhầm một path có thật là tự
 * gỡ lớp bảo vệ của nó.
 */
export const GONE_ROUTES = ["/vinmec"];

/**
 * Prefix URL thật của khu vực dược sĩ.
 * Route group `(review)` KHÔNG xuất hiện trong URL — nó chỉ nhóm layout.
 * Thứ chặn thật là middleware match theo prefix này.
 */
export const REVIEW_PREFIX = "/review";

/**
 * Neo tới từng section của landing page — dùng cho nav và nút CTA.
 *
 * Mỗi giá trị PHẢI khớp `id` của đúng một element trên `/`: scroll spy trong
 * `LandingHeader` dò section hiện hành bằng chính các id này. Thêm neo mới mà quên
 * gắn `id` sẽ hỏng IM LẶNG — link vẫn bấm được nhưng underline không bao giờ sáng.
 */
export const LANDING_SECTIONS = {
  HOME: "#trang-chu",
  FEATURES: "#tinh-nang",
  HOW_IT_WORKS: "#cach-hoat-dong",
  CONTACT: "#lien-he",
} as const;

export const ROUTES = {
  /** Trang chủ Vinmec — cổng bệnh viện, KHÔNG phải màn tra cứu thuốc. */
  HOME: "/",
  /** Màn tra cứu an toàn thuốc, vào từ mục "Tính năng" trên nav Vinmec. */
  FEATURE: "/tinh-nang",
  /**
   * Trang "Về Vinmec" — tầm nhìn, giá trị C.A.R.E, năng lực, giải thưởng, cột mốc,
   * đối tác. Trên vinmec.com đây là NHÓM MENU 9 trang riêng; bản mô phỏng gộp phần
   * nội dung chính vào một route, nên mọi mục con của dropdown đều trỏ về đây.
   */
  ABOUT: "/ve-vinmec",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  DRUG_INFORMATION: "/drug-information",
  INTERACTIONS: "/interactions",
  INTERACTIONS_DRUG_DRUG: "/interactions/drug-drug",
  INTERACTIONS_DRUG_FOOD: "/interactions/drug-food",
  INTERACTIONS_DRUG_DISEASE: "/interactions/drug-disease",
  PRESCRIPTIONS_REVIEW: "/prescriptions/review",
  HISTORY: "/history",
  INTERACTION_CHECKS: "/interaction-checks",
  SETTINGS: "/settings",
  REVIEW: "/review",
  REVIEW_QUEUE: "/review/queue",
} as const;

/** Route mặc định sau đăng nhập, dùng chung cho proxy và các auth page server-side. */
export const dashboardForRoles = (roles: string[] | undefined): string | null => {
  if (roles?.includes(ROLES.PHARMACIST)) return ROUTES.REVIEW;
  if (roles?.includes(ROLES.PATIENT)) return ROUTES.DASHBOARD;
  return null;
};
