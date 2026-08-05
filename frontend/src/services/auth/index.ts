/**
 * Tầng HTTP thuần cho auth.
 *
 * ⚠️ Backend chưa có module auth (email/password). Thân hàm loginRequest/registerRequest/
 * getProfileRequest đang comment lại, chờ nối.
 * `loginRequest` được `src/lib/auth.ts` (CredentialsProvider) gọi tới.
 */

import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { apiNotReady } from "@/queries/utils";

// import clientRequest from "@/utils/request";

export const loginRequest = async (
  data: ILoginRequest
): Promise<ILoginResponse> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.AUTH.LOGIN;
  //   const retrieved = await clientRequest.post(apiUrl, data);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.AUTH.LOGIN, { email: data.email });
};

export const registerRequest = async (
  data: IRegisterRequest
): Promise<IAuthUser> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.AUTH.REGISTER;
  //   const retrieved = await clientRequest.post(apiUrl, data);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.AUTH.REGISTER, { email: data.email });
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

export const getProfileRequest = async (): Promise<IAuthUser> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.AUTH.GET_PROFILE;
  //   const retrieved = await clientRequest.get(apiUrl);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.AUTH.GET_PROFILE);
};
