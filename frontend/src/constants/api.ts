/**
 * Một nguồn sự thật cho mọi endpoint. Không rải string URL trong code.
 *
 * ⚠️ Backend hiện có /health, /api/v1/status và nhóm /api/v1/auth/*. Các nhóm còn lại
 * khai báo trước theo đúng router mà backend đã dự trù trong
 * `backend/src/medsafe/api/routes.py` — bật dần khi từng module sẵn sàng.
 */

/**
 * Base URL của backend. Dùng trực tiếp trong `services/*`, tự đúng ở cả hai phía.
 *
 * ★ Vì sao không chỉ đọc mỗi NEXT_PUBLIC_API_BASE_URL:
 *   `authorize()` của NextAuth CredentialsProvider chạy TRONG process Next, không phải
 *   trong trình duyệt. Khi deploy bằng Docker, `localhost:8000` ở đó trỏ về CHÍNH
 *   container frontend chứ không phải backend → connection refused. Triệu chứng là
 *   "Không thể đăng nhập. Vui lòng thử lại." còn backend không ghi log gì cả, vì request
 *   chưa từng rời khỏi container.
 *
 *   Nên phía server ưu tiên API_INTERNAL_URL (compose đặt = http://backend:8000, đi thẳng
 *   qua mạng nội bộ). Trên VPS điều này còn tránh việc request vòng ra Internet rồi quay
 *   lại qua Caddy. Khi chạy `make dev`, biến đó để trống nên tự lùi về giá trị public —
 *   lúc ấy Next và FastAPI cùng trên host nên `localhost:8000` vốn đã đúng.
 *
 * Nhánh `typeof window === "undefined"` bị webpack loại bỏ hẳn khỏi bundle client, nên
 * API_INTERNAL_URL không bao giờ lộ ra trình duyệt. Nó cũng không có tiền tố
 * NEXT_PUBLIC_ nên được đọc lúc CHẠY, không bị nhúng cứng lúc build.
 */
export const API_BASE_URL =
  (typeof window === "undefined" ? process.env.API_INTERNAL_URL : "") ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "";

if (!API_BASE_URL && typeof window === "undefined") {
  console.warn("⚠️ NEXT_PUBLIC_API_BASE_URL chưa được set!");
}

/** Prefix version của FastAPI — xem `create_app()` trong backend/src/medsafe/main.py */
export const API_V1 = "/api/v1";

export const API_ENDPOINTS = {
  SYSTEM: {
    HEALTH: "/health",
    STATUS: `${API_V1}/status`,
  },

  /**
   * REGISTER, LOGIN, GOOGLE, REFRESH_TOKEN và GET_PROFILE đã CHẠY THẬT ở backend.
   * Ba endpoint password bên dưới thì chưa — xem ADR 0015/0016.
   */
  AUTH: {
    REGISTER: `${API_V1}/auth/register`,
    LOGIN: `${API_V1}/auth/login`,
    GOOGLE: `${API_V1}/auth/google`,
    REFRESH_TOKEN: `${API_V1}/auth/refresh`,
    GET_PROFILE: `${API_V1}/auth/profiles`,
    RECOVERY_PASSWORD: `${API_V1}/auth/password`,
    RESET_PASSWORD: `${API_V1}/auth/password`,
    UPDATE_PASSWORD: `${API_V1}/auth/password`,
  },

  // ── Chưa có ở backend, khai báo trước ──────────────────────────────────────

  /** Tra tương tác thuốc–thuốc và thuốc–thực phẩm */
  INTERACTIONS: {
    CHECK: `${API_V1}/interactions/check`,
    GET_ALL: `${API_V1}/interactions`,
    GET_DETAILS: (id: string) => `${API_V1}/interactions/${id}`,
  },

  /**
   * Danh mục thuốc. SEARCH, GET_ALL và LETTERS đã CHẠY THẬT ở backend (VMEC-29);
   * GET_DETAILS thì chưa — xem `backend/src/medsafe/api/v1/drugs.py`.
   */
  DRUGS: {
    SEARCH: `${API_V1}/drugs/search`,
    GET_ALL: `${API_V1}/drugs`,
    LETTERS: `${API_V1}/drugs/letters`,
    GET_DETAILS: (id: string) => `${API_V1}/drugs/${id}`,
  },

  /** Lịch sử tra cứu — một lượt tra cứu có thể gồm nhiều cặp thuốc/thuốc hoặc thuốc/thực phẩm */
  INTERACTION_CHECKS: {
    GET_ALL: `${API_V1}/interaction-checks`,
    GET_DETAILS: (id: string) => `${API_V1}/interaction-checks/${id}`,
    DELETE: (id: string) => `${API_V1}/interaction-checks/${id}`,
    CLEAR: `${API_V1}/interaction-checks`,
  },

  DISEASES: { SEARCH: `${API_V1}/diseases` },
  HEALTH_PROFILE: {
    GET: `${API_V1}/patients/me/health-profile`,
    UPDATE: `${API_V1}/patients/me/health-profile`,
    CONDITIONS: `${API_V1}/patients/me/conditions`,
    DELETE_CONDITION: (id: string) => `${API_V1}/patients/me/conditions/${id}`,
  },

  /** Đơn thuốc người dùng lưu lại */
  PRESCRIPTIONS: {
    GET_ALL: `${API_V1}/prescriptions`,
    CREATE: `${API_V1}/prescriptions`,
    GET_DETAILS: (id: string) => `${API_V1}/prescriptions/${id}`,
    DELETE: (id: string) => `${API_V1}/prescriptions/${id}`,
  },

  /** Hàng đợi duyệt của dược sĩ — human-in-the-loop */
  REVIEWS: {
    GET_QUEUE: `${API_V1}/reviews/queue`,
    APPROVE: (id: string) => `${API_V1}/reviews/${id}/approve`,
    REJECT: (id: string) => `${API_V1}/reviews/${id}/reject`,
  },
} as const;
