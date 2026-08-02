/**
 * Một nguồn sự thật cho mọi endpoint. Không rải string URL trong code.
 *
 * ⚠️ Backend hiện MỚI CHỈ có /health và /api/v1/status. Các nhóm endpoint bên dưới
 * khai báo trước theo đúng router mà backend đã dự trù trong
 * `backend/src/medsafe/api/routes.py` — bật dần khi từng module sẵn sàng.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

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

  // ── Chưa có ở backend, khai báo trước ──────────────────────────────────────

  AUTH: {
    REGISTER: `${API_V1}/auth/register`,
    LOGIN: `${API_V1}/auth/tokens`,
    REFRESH_TOKEN: `${API_V1}/auth/tokens`,
    GET_PROFILE: `${API_V1}/auth/profiles`,
    RECOVERY_PASSWORD: `${API_V1}/auth/password`,
    RESET_PASSWORD: `${API_V1}/auth/password`,
    UPDATE_PASSWORD: `${API_V1}/auth/password`,
  },

  /** Tra tương tác thuốc–thuốc và thuốc–thực phẩm */
  INTERACTIONS: {
    CHECK: `${API_V1}/interactions/check`,
    GET_ALL: `${API_V1}/interactions`,
    GET_DETAILS: (id: string) => `${API_V1}/interactions/${id}`,
  },

  /** Danh mục thuốc + chuẩn hoá tên (khớp mờ) */
  DRUGS: {
    SEARCH: `${API_V1}/drugs/search`,
    GET_ALL: `${API_V1}/drugs`,
    GET_DETAILS: (id: string) => `${API_V1}/drugs/${id}`,
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
