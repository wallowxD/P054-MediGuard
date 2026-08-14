/**
 * Một nguồn sự thật cho mọi endpoint. Không rải string URL trong code.
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

  INTERACTIONS: {
    CHECK: `${API_V1}/interactions/check`,
    GET_ALL: `${API_V1}/interactions`,
    GET_DETAILS: (id: string) => `${API_V1}/interactions/${id}`,
  },

  CHAT: {
    MESSAGE: `${API_V1}/chat/message`,
  },

  DRUGS: {
    SEARCH: `${API_V1}/drugs/search`,
    GET_ALL: `${API_V1}/drugs`,
    LETTERS: `${API_V1}/drugs/letters`,
    GET_DETAILS: (id: string) => `${API_V1}/drugs/${id}`,
  },

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
    DISEASES: `${API_V1}/patients/me/diseases`,
    DELETE_DISEASE: (id: string) => `${API_V1}/patients/me/diseases/${id}`,
  },

  PRESCRIPTIONS: {
    EXTRACT: `${API_V1}/prescriptions/extract`,
    GET_ALL: `${API_V1}/prescriptions`,
    CREATE: `${API_V1}/prescriptions`,
    GET_DETAILS: (id: string) => `${API_V1}/prescriptions/${id}`,
    DELETE: (id: string) => `${API_V1}/prescriptions/${id}`,
  },

  REVIEWS: {
    GET_QUEUE: `${API_V1}/reviews/queue`,
    APPROVE: (id: string) => `${API_V1}/reviews/${id}/approve`,
    REJECT: (id: string) => `${API_V1}/reviews/${id}/reject`,
  },
} as const;
