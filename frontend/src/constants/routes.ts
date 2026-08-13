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

/**
 * Route công khai nhưng CỐ Ý không nằm trong OPEN_ROUTES.
 *
 * `/vinmec` là bản mô phỏng tĩnh cổng Vinmec, chỉ dùng để trình diễn luồng điều
 * hướng sang landing page MediGuard. Nó mang thương hiệu của một tổ chức có thật
 * nên KHÔNG được vào sitemap và bị chặn trong robots.txt — để nó lọt vào
 * OPEN_ROUTES là tự đẩy một trang nhái lên Google.
 *
 * Vẫn phải có mặt trong PUBLIC_ROUTES, nếu không middleware đá khách về /signin.
 */
export const DEMO_ROUTES = ["/vinmec"];

export const PUBLIC_ROUTES = [...AUTH_ROUTES, ...OPEN_ROUTES, ...DEMO_ROUTES];

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
  HOME: "/",
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
  /** Cổng Vinmec mô phỏng — xem ghi chú ở DEMO_ROUTES */
  VINMEC: "/vinmec",
} as const;

/**
 * Query param đánh dấu "khách vừa từ cổng Vinmec bấm sang".
 *
 * Landing page MediGuard dùng nó để hiện thanh quay lại Vinmec. Không có param
 * thì trang giữ nguyên như cũ — khách vào thẳng "/" không thấy gì thay đổi.
 */
export const VINMEC_REFERRER_PARAM = "from";
export const VINMEC_REFERRER_VALUE = "vinmec";

/** Link từ nav Vinmec sang landing page MediGuard, kèm dấu vết để quay lại được. */
export const MEDIGUARD_FROM_VINMEC = `${ROUTES.HOME}?${VINMEC_REFERRER_PARAM}=${VINMEC_REFERRER_VALUE}`;
