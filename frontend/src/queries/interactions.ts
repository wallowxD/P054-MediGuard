/**
 * React Query hooks cho domain `interactions`.
 * Component chỉ import từ đây, không import thẳng `services/*`.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkInteractionsRequest,
  addHealthConditionRequest,
  clearInteractionChecksRequest,
  deleteHealthConditionRequest,
  deleteInteractionCheckRequest,
  getDrugDetailsRequest,
  getDrugLettersRequest,
  getInteractionCheckDetailsRequest,
  getInteractionChecksRequest,
  getHealthProfileRequest,
  getInteractionDetailsRequest,
  getInteractionsRequest,
  listDrugsRequest,
  searchDiseasesRequest,
  searchDrugsRequest,
  updateHealthProfileRequest,
} from "@/services/interactions";

// ── Query Keys ───────────────────────────────────────────────────────────────
// Phân cấp để invalidate có chọn lọc:
//   interactionKeys.all    → xoá sạch cache domain
//   interactionKeys.lists() → chỉ động tới danh sách
export const interactionKeys = {
  all: ["interactions"] as const,
  lists: () => [...interactionKeys.all, "list"] as const,
  list: (params: IInteractionsGetAllRequest) => [...interactionKeys.lists(), params] as const,
  details: () => [...interactionKeys.all, "detail"] as const,
  detail: (id: string) => [...interactionKeys.details(), id] as const,
  drugSearch: (keyword: string, limit?: number) => ["drugs", "search", keyword, limit] as const,
};

export const drugKeys = {
  all: ["drugs"] as const,
  details: () => [...drugKeys.all, "detail"] as const,
  detail: (id: string) => [...drugKeys.details(), id] as const,
  lists: () => [...drugKeys.all, "list"] as const,
  list: (params: IDrugListRequest) => [...drugKeys.lists(), params] as const,
  letters: () => [...drugKeys.all, "letters"] as const,
};

export const interactionCheckKeys = {
  all: ["interaction-checks"] as const,
  lists: () => [...interactionCheckKeys.all, "list"] as const,
  details: () => [...interactionCheckKeys.all, "detail"] as const,
  detail: (id: string) => [...interactionCheckKeys.details(), id] as const,
};

export const healthKeys = { profile: ["health-profile"] as const };
export const diseaseKeys = { search: (q: string) => ["diseases", q] as const };

// ── Queries ──────────────────────────────────────────────────────────────────

export const useInteractions = (params: IInteractionsGetAllRequest, enabled: boolean = true) =>
  useQuery({
    queryKey: interactionKeys.list(params),
    queryFn: () => getInteractionsRequest(params),
    enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

export const useInteraction = (id: string, enabled: boolean = true) =>
  useQuery({
    queryKey: interactionKeys.detail(id),
    queryFn: () => getInteractionDetailsRequest(id),
    enabled: enabled && !!id,
  });

/**
 * Gõ tên thuốc → gợi ý. Chuẩn hoá tên và xếp hạng do backend `domain/normalization.py` lo.
 *
 * Chạy từ MỘT ký tự: backend xếp hạng tiền tố tên biệt dược trước nên gõ "H" đã ra thuốc
 * vần H. Chặn ở 2 ký tự như trước sẽ làm hỏng đúng trường hợp phổ biến nhất.
 */
export const useDrugSearch = (keyword: string, enabled: boolean = true, limit?: number) =>
  useQuery({
    queryKey: interactionKeys.drugSearch(keyword, limit),
    queryFn: () => searchDrugsRequest({ q: keyword, limit }),
    enabled: enabled && keyword.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Duyệt danh mục theo chữ cái, có phân trang.
 *
 * `keepPreviousData` giữ trang cũ trong lúc tải trang mới — không có nó thì mỗi lần bấm
 * số trang danh sách sẽ nháy về rỗng rồi mới hiện lại, và chiều cao trang nhảy theo.
 */
export const useDrugList = (params: IDrugListRequest, enabled: boolean = true) =>
  useQuery({
    queryKey: drugKeys.list(params),
    queryFn: () => listDrugsRequest(params),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

/**
 * Chỉ mục A–Z cho thanh chữ cái.
 *
 * Danh mục bệnh viện gần như không đổi trong một phiên làm việc nên cache dài; gọi lại ở
 * mỗi lần đổi vần là lãng phí một round-trip cho dữ liệu không đổi.
 */
export const useDrugLetters = (enabled: boolean = true) =>
  useQuery({
    queryKey: drugKeys.letters(),
    queryFn: () => getDrugLettersRequest(),
    enabled,
    staleTime: 30 * 60 * 1000,
  });

/** Chi tiết một thuốc cho `/drug-information/[id]` — chuẩn bị cho GET /api/v1/drugs/{id} */
export const useDrugDetails = (id: string, enabled: boolean = true) =>
  useQuery({
    queryKey: drugKeys.detail(id),
    queryFn: () => getDrugDetailsRequest(id),
    enabled: enabled && !!id,
  });

/** Danh sách lượt tra cứu cho `/history` — chuẩn bị cho GET /api/v1/interaction-checks */
export const useInteractionChecks = (enabled: boolean = true) =>
  useQuery({
    queryKey: interactionCheckKeys.lists(),
    queryFn: () => getInteractionChecksRequest(),
    enabled,
  });

/** Chi tiết một lượt tra cứu cho `/interaction-checks/[id]` */
export const useInteractionCheckDetail = (id: string, enabled: boolean = true) =>
  useQuery({
    queryKey: interactionCheckKeys.detail(id),
    queryFn: () => getInteractionCheckDetailsRequest(id),
    enabled: enabled && !!id,
  });

export const useDiseaseSearch = (query: string, enabled: boolean = true) =>
  useQuery({
    queryKey: diseaseKeys.search(query),
    queryFn: () => searchDiseasesRequest(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 10 * 60 * 1000,
  });

export const useHealthProfile = () =>
  useQuery({ queryKey: healthKeys.profile, queryFn: getHealthProfileRequest });

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Tra tương tác cho một danh sách thuốc.
 * Dùng mutation chứ không phải query vì đây là hành động người dùng chủ động bấm,
 * và payload (danh sách thuốc) không phải khoá cache tự nhiên.
 */
export const useCheckInteractions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IInteractionCheckRequest) => checkInteractionsRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: interactionCheckKeys.lists() });
    },
  });
};

export const useUpdateHealthProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateHealthProfileRequest,
    onSuccess: (data) => queryClient.setQueryData(healthKeys.profile, data),
  });
};

export const useAddHealthCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addHealthConditionRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: healthKeys.profile }),
  });
};

export const useDeleteHealthCondition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHealthConditionRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: healthKeys.profile }),
  });
};

export const useDeleteInteractionCheck = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInteractionCheckRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: interactionCheckKeys.all }),
  });
};

export const useClearInteractionChecks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearInteractionChecksRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: interactionCheckKeys.all }),
  });
};
