/**
 * Tầng HTTP thuần cho domain `interactions`.
 * KHÔNG import React, KHÔNG chứa hook. Component không gọi thẳng file này —
 * luôn đi qua `src/queries/interactions.ts`.
 *
 * ⚠️ Backend chưa bật router /api/v1/interactions (xem
 * `backend/src/medsafe/api/routes.py`). Thân hàm đang comment lại; mở ra khi có API.
 */

import { API_ENDPOINTS } from "@/constants/api";
import { apiNotReady } from "@/queries/utils";

// import { API_BASE_URL } from "@/constants/api";
// import clientRequest from "@/utils/request";

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

export const searchDrugsRequest = async (
  params: IDrugSearchRequest
): Promise<IDrugSearchResponse> => {
  // try {
  //   const apiUrl = API_BASE_URL + API_ENDPOINTS.DRUGS.SEARCH;
  //   const retrieved = await clientRequest.get(apiUrl, { params });
  //   return retrieved?.data;
  // } catch (error: unknown) {
  //   const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
  //   throw new Error(message);
  // }
  return apiNotReady(API_ENDPOINTS.DRUGS.SEARCH, params);
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
