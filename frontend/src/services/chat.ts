import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import clientRequest from "@/utils/request";

type ApiErrorBody = { message?: string; detail?: string };

const apiError = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return new Error(error.response?.data?.message || error.response?.data?.detail || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};

export const sendChatMessageRequest = async (payload: IChatRequest): Promise<IChatResponse> => {
  try {
    return (await clientRequest.post<IChatResponse>(API_BASE_URL + API_ENDPOINTS.CHAT.MESSAGE, payload)).data;
  } catch (error) {
    throw apiError(error, "Không thể kết nối với trợ lý AI. Vui lòng thử lại.");
  }
};
