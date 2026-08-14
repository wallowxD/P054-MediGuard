/**
 * Tầng HTTP DUY NHẤT của app. Không tạo helper fetch riêng ở chỗ khác —
 * hai tầng HTTP song song là lỗi số 4 trong danh sách "lỗi cần tránh".
 *
 * JWT callback của NextAuth làm mới access token ở phía server mỗi khi `getSession()`
 * thấy token sắp hết hạn. Refresh token không được đưa ra client session.
 */

import axios, { type AxiosError } from "axios";
import { getSession, signOut } from "next-auth/react";
import { ROUTES } from "@/constants/routes";

const clientRequest = axios.create({
  responseType: "json",
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// Request: gắn access token từ session NextAuth
clientRequest.interceptors.request.use(async (config) => {
  // `loginRequest()` chạy phía server trong NextAuth CredentialsProvider. Ở đó không có
  // browser session để đọc, và gọi getSession() có thể tự quay lại /api/auth/session.
  if (typeof window === "undefined") return config;

  const session = await getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Response: token đã được refresh trước request; 401 còn lại là phiên không hợp lệ.
clientRequest.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status !== 401 || typeof window === "undefined") {
      return Promise.reject(error);
    }
    await signOut({ redirect: true, callbackUrl: ROUTES.SIGNIN });
    return Promise.reject(error);
  }
);

export default clientRequest;
