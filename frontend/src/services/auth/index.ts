/**
 * Tầng HTTP thuần cho auth.
 *
 * ⚠️ Backend chưa có module auth. Thân hàm đang comment lại.
 * `loginRequest` được `src/lib/auth.ts` (CredentialsProvider) gọi tới.
 */

import { API_ENDPOINTS } from "@/constants/api";
import { apiNotReady } from "@/queries/utils";

// import { API_BASE_URL } from "@/constants/api";
// import clientRequest from "@/utils/request";

export const loginRequest = async (
  data: ILoginRequest
): Promise<IApiResponse<ILoginResponse>> => {
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
): Promise<IApiResponse<IAuthUser>> => {
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

export const getProfileRequest = async (): Promise<IApiResponse<IAuthUser>> => {
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
