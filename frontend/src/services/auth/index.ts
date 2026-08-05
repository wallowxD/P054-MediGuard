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
