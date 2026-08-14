/** Tầng HTTP thuần cho auth. */

import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import clientRequest from "@/utils/request";

type ApiErrorBody = {
  message?: string;
};

const apiError = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return new Error(error.response?.data?.message || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};
/**
 * Tầng HTTP thuần cho auth.
 *
 * `loginRequest` được `src/lib/auth.ts` (CredentialsProvider) gọi tới.
 */

export const loginRequest = async (
  data: ILoginRequest
): Promise<ILoginResponse> => {
  try {
    const response = await clientRequest.post<ILoginResponse>(
      API_BASE_URL + API_ENDPOINTS.AUTH.LOGIN,
      data
    );
    return response.data;
  } catch (error: unknown) {
    throw apiError(error, "Không thể đăng nhập. Vui lòng thử lại.");
  }
};

export const registerRequest = async (
  data: IRegisterRequest
): Promise<IAuthUser> => {
  try {
    const response = await clientRequest.post<IAuthUser>(
      API_BASE_URL + API_ENDPOINTS.AUTH.REGISTER,
      data
    );
    return response.data;
  } catch (error: unknown) {
    throw apiError(error, "Không thể đăng ký. Vui lòng thử lại.");
  }
};

/**
 * `POST /api/v1/auth/google` — xem ADR 0016. Đã CHẠY THẬT ở backend.
 *
 * Cố tình dùng `axios` thẳng thay vì `clientRequest`: interceptor 401 của
 * `clientRequest` coi mọi 401 là access token hết hạn và cố refresh rồi `signOut()`.
 * Ở đây 401 nghĩa là "Google ID token không hợp lệ" trong lúc CHƯA đăng nhập — dùng
 * interceptor đó sẽ kích hoạt signOut() không cần thiết. `refreshTokenAndUpdateSession`
 * trong `utils/request.ts` cũng né interceptor cùng lý do này.
 */
export const loginWithGoogleRequest = async (data: IGoogleLoginRequest): Promise<ILoginResponse> => {
  const apiUrl = API_BASE_URL + API_ENDPOINTS.AUTH.GOOGLE;
  const { data: response } = await axios.post<ILoginResponse>(apiUrl, data);
  return response;
};

/**
 * Dùng axios riêng để tránh interceptor 401 của request nghiệp vụ tự gọi lại chính
 * endpoint refresh. Hàm này chỉ được gọi từ JWT callback của NextAuth ở phía server.
 */
export const refreshTokenRequest = async (
  data: IRefreshTokenRequest
): Promise<IRefreshTokenResponse> => {
  const apiUrl = API_BASE_URL + API_ENDPOINTS.AUTH.REFRESH_TOKEN;
  const { data: response } = await axios.post<IRefreshTokenResponse>(apiUrl, data);
  return response;
};

export const getProfileRequest = async (): Promise<IAuthUser> => {
  try {
    const response = await clientRequest.get<IAuthUser>(
      API_BASE_URL + API_ENDPOINTS.AUTH.GET_PROFILE
    );
    return response.data;
  } catch (error: unknown) {
    throw apiError(error, "Không thể tải hồ sơ người dùng.");
  }
};
