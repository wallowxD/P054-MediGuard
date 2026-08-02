/**
 * Tầng HTTP DUY NHẤT của app. Không tạo helper fetch riêng ở chỗ khác —
 * hai tầng HTTP song song là lỗi số 4 trong danh sách "lỗi cần tránh".
 *
 * Điểm quan trọng: chống refresh token song song + cooldown. Nhiều request cùng
 * dính 401 một lúc thì chỉ refresh ĐÚNG MỘT lần, các request còn lại chờ chung
 * một promise.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getSession, signOut } from "next-auth/react";
import { ROUTES } from "@/constants/routes";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

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

/**
 * Gọi refresh token rồi cập nhật session.
 *
 * TODO(API): backend chưa có `POST /api/v1/auth/tokens`. Khi có thì mở khối dưới.
 * Hiện trả về false → interceptor sẽ signOut, đúng hành vi mong muốn khi hết hạn.
 */
async function refreshTokenAndUpdateSession(): Promise<boolean> {
  // const session = await getSession();
  // if (!session?.refreshToken) return false;
  // try {
  //   const { data } = await axios.post<IRefreshTokenResponse>(
  //     API_BASE_URL + API_ENDPOINTS.AUTH.REFRESH_TOKEN,
  //     { refreshToken: session.refreshToken } satisfies IRefreshTokenRequest
  //   );
  //   await getSession(); // buộc NextAuth đọc lại JWT đã xoay vòng
  //   return Boolean(data?.accessToken);
  // } catch {
  //   return false;
  // }
  return false;
}

// Response: 401 → refresh → retry
clientRequest.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Vừa thử refresh xong mà lại 401 → token hỏng thật, đừng quay vòng
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
      await signOut({ redirect: true, callbackUrl: ROUTES.SIGNIN });
      return Promise.reject(error);
    }

    return clientRequest(originalRequest);
  }
);

export default clientRequest;
