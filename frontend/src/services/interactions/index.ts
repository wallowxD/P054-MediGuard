/**
 * Tầng HTTP thuần cho domain `interactions`.
 * KHÔNG import React, KHÔNG chứa hook. Component không gọi thẳng file này —
 * luôn đi qua `src/queries/interactions.ts`.
 *
 * Trạng thái backend (xem `backend/src/medsafe/api/routes.py`):
 * - ĐÃ CHẠY THẬT: `/drugs`, `/drugs/letters`, `/drugs/search` (VMEC-29).
 * - CHƯA CÓ: `/interactions/*`, `/drugs/{id}`, `/interaction-checks/*` — thân hàm vẫn
 *   comment lại và trả `apiNotReady()`.
 */

import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api";
import { apiNotReady } from "@/queries/utils";
import clientRequest from "@/utils/request";

type ApiErrorBody = { message?: string };

/**
 * Gộp lỗi axios về `Error` có thông điệp đọc được cho người dùng.
 *
 * Không nuốt lỗi và không trả mảng rỗng khi request hỏng: danh mục rỗng vì lỗi mạng
 * trông y hệt danh mục rỗng vì không có thuốc, và người dùng sẽ tin là bệnh viện không
 * có thuốc đó.
 */
const apiError = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return new Error(error.response?.data?.message || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};

export const checkInteractionsRequest = async (
  data: IInteractionCheckRequest
): Promise<IInteractionCheckResponse> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.INTERACTIONS.CHECK;
  //   const retrieved = await clientRequest.post(apiUrl, data);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.INTERACTIONS.CHECK, data);
};

export const getInteractionsRequest = async (
  params: IInteractionsGetAllRequest
): Promise<IInteractionsGetAllResponse> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.INTERACTIONS.GET_ALL;
  //   const retrieved = await clientRequest.get(apiUrl, { params });
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.INTERACTIONS.GET_ALL, params);
};

export const getInteractionDetailsRequest = async (
  id: string
): Promise<IInteractionItem> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.INTERACTIONS.GET_DETAILS(id);
  //   const retrieved = await clientRequest.get(apiUrl);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.INTERACTIONS.GET_DETAILS(id));
};

/** `GET /api/v1/drugs/search` — autocomplete khớp mờ, xếp hạng theo tên biệt dược. */
export const searchDrugsRequest = async (
  params: IDrugSearchRequest
): Promise<IDrugSearchResponse> => {
  try {
    const response = await clientRequest.get<IDrugSearchResponse>(
      API_BASE_URL + API_ENDPOINTS.DRUGS.SEARCH,
      { params }
    );
    return response.data;
  } catch (error: unknown) {
    throw apiError(error, "Không thể tìm thuốc. Vui lòng thử lại.");
  }
};

/** `GET /api/v1/drugs` — duyệt danh mục theo chữ cái, lọc tất định, có phân trang. */
export const listDrugsRequest = async (
  params: IDrugListRequest
): Promise<IDrugListResponse> => {
  try {
    const response = await clientRequest.get<IDrugListResponse>(
      API_BASE_URL + API_ENDPOINTS.DRUGS.GET_ALL,
      { params }
    );
    return response.data;
  } catch (error: unknown) {
    throw apiError(error, "Không thể tải danh mục thuốc. Vui lòng thử lại.");
  }
};

/** `GET /api/v1/drugs/letters` — số thuốc theo từng chữ cái, dựng thanh A–Z. */
export const getDrugLettersRequest = async (): Promise<IDrugLetterIndexResponse> => {
  try {
    const response = await clientRequest.get<IDrugLetterIndexResponse>(
      API_BASE_URL + API_ENDPOINTS.DRUGS.LETTERS
    );
    return response.data;
  } catch (error: unknown) {
    throw apiError(error, "Không thể tải chỉ mục chữ cái. Vui lòng thử lại.");
  }
};

export const getDrugDetailsRequest = async (id: string): Promise<IDrugInformationDetail> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.DRUGS.GET_DETAILS(id);
  //   const retrieved = await clientRequest.get(apiUrl);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.DRUGS.GET_DETAILS(id));
};

export const getInteractionChecksRequest = async (): Promise<IInteractionCheckSummaryItem[]> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.INTERACTION_CHECKS.GET_ALL;
  //   const retrieved = await clientRequest.get(apiUrl);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.INTERACTION_CHECKS.GET_ALL);
};

export const getInteractionCheckDetailsRequest = async (
  id: string
): Promise<IInteractionCheckDetail> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.INTERACTION_CHECKS.GET_DETAILS(id);
  //   const retrieved = await clientRequest.get(apiUrl);
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.INTERACTION_CHECKS.GET_DETAILS(id));
};
