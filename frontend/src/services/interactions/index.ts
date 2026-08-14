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

type ApiErrorBody = { message?: string; detail?: string };

/**
 * Gộp lỗi axios về `Error` có thông điệp đọc được cho người dùng.
 *
 * Không nuốt lỗi và không trả mảng rỗng khi request hỏng: danh mục rỗng vì lỗi mạng
 * trông y hệt danh mục rỗng vì không có thuốc, và người dùng sẽ tin là bệnh viện không
 * có thuốc đó.
 */
const apiError = (error: unknown, fallback: string): Error => {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return new Error(error.response?.data?.message || error.response?.data?.detail || fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
};

export const checkInteractionsRequest = async (
  data: IInteractionCheckRequest
): Promise<IInteractionCheckResponse> => {
  try {
    return (await clientRequest.post<IInteractionCheckResponse>(API_BASE_URL + API_ENDPOINTS.INTERACTIONS.CHECK, data)).data;
  } catch (error) {
    throw apiError(error, "Không thể tra cứu tương tác. Vui lòng thử lại.");
  }
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
  try {
    return (await clientRequest.get<IInteractionCheckListResponse>(API_BASE_URL + API_ENDPOINTS.INTERACTION_CHECKS.GET_ALL)).data.items;
  } catch (error) {
    throw apiError(error, "Không thể tải lịch sử tra cứu.");
  }
};

export const getInteractionCheckDetailsRequest = async (
  id: string
): Promise<IInteractionCheckDetail> => {
  try {
    return (await clientRequest.get<IInteractionCheckDetail>(API_BASE_URL + API_ENDPOINTS.INTERACTION_CHECKS.GET_DETAILS(id))).data;
  } catch (error) {
    throw apiError(error, "Không thể tải lượt tra cứu.");
  }
};

export const searchDiseasesRequest = async (q: string): Promise<IDiseaseSearchResponse> => {
  try {
    return (await clientRequest.get<IDiseaseSearchResponse>(API_BASE_URL + API_ENDPOINTS.DISEASES.SEARCH, { params: { q, limit: 10 } })).data;
  } catch (error) {
    throw apiError(error, "Không thể tìm bệnh nền.");
  }
};

export const getHealthProfileRequest = async (): Promise<IHealthProfile> =>
  (await clientRequest.get<IHealthProfile>(API_BASE_URL + API_ENDPOINTS.HEALTH_PROFILE.GET)).data;

export const updateHealthProfileRequest = async (data: IHealthProfileUpdate): Promise<IHealthProfile> =>
  (await clientRequest.put<IHealthProfile>(API_BASE_URL + API_ENDPOINTS.HEALTH_PROFILE.UPDATE, data)).data;

export const addHealthConditionRequest = async (conditionCode: TConditionCode): Promise<IPatientCondition> =>
  (await clientRequest.post<IPatientCondition>(API_BASE_URL + API_ENDPOINTS.HEALTH_PROFILE.CONDITIONS, { conditionCode })).data;

export const deleteHealthConditionRequest = async (id: string): Promise<void> => {
  await clientRequest.delete(API_BASE_URL + API_ENDPOINTS.HEALTH_PROFILE.DELETE_CONDITION(id));
};

export const addPatientDiseaseRequest = async (diseaseId: string): Promise<IPatientDisease> =>
  (
    await clientRequest.post<IPatientDisease>(API_BASE_URL + API_ENDPOINTS.HEALTH_PROFILE.DISEASES, {
      diseaseId,
    })
  ).data;

export const deletePatientDiseaseRequest = async (id: string): Promise<void> => {
  await clientRequest.delete(API_BASE_URL + API_ENDPOINTS.HEALTH_PROFILE.DELETE_DISEASE(id));
};

export const deleteInteractionCheckRequest = async (id: string): Promise<void> => {
  await clientRequest.delete(API_BASE_URL + API_ENDPOINTS.INTERACTION_CHECKS.DELETE(id));
};

export const clearInteractionChecksRequest = async (): Promise<void> => {
  await clientRequest.delete(API_BASE_URL + API_ENDPOINTS.INTERACTION_CHECKS.CLEAR);
};

export const extractPrescriptionRequest = async (
  images: File[]
): Promise<IPrescriptionExtractionResponse> => {
  const formData = new FormData();
  images.forEach((image) => formData.append("images", image));
  try {
    return (
      await clientRequest.post<IPrescriptionExtractionResponse>(
        API_BASE_URL + API_ENDPOINTS.PRESCRIPTIONS.EXTRACT,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
    ).data;
  } catch (error) {
    throw apiError(error, "Không thể đọc ảnh đơn thuốc. Vui lòng thử lại hoặc nhập thuốc thủ công.");
  }
};
