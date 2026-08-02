/**
 * React Query hooks cho domain `interactions`.
 * Component chỉ import từ đây, không import thẳng `services/*`.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkInteractionsRequest,
  getInteractionDetailsRequest,
  getInteractionsRequest,
  searchDrugsRequest,
} from "@/services/interactions";
import { withApiTransform } from "./utils";

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
  drugSearch: (keyword: string) => ["drugs", "search", keyword] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export const useInteractions = (params: IInteractionsGetAllRequest, enabled: boolean = true) =>
  useQuery({
    queryKey: interactionKeys.list(params),
    queryFn: withApiTransform(() => getInteractionsRequest(params)),
    enabled,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

export const useInteraction = (id: string, enabled: boolean = true) =>
  useQuery({
    queryKey: interactionKeys.detail(id),
    queryFn: withApiTransform(() => getInteractionDetailsRequest(id)),
    enabled: enabled && !!id,
  });

/** Gõ tên thuốc → gợi ý. Chuẩn hoá tên (khớp mờ) do backend `domain/normalization.py` lo. */
export const useDrugSearch = (keyword: string, enabled: boolean = true) =>
  useQuery({
    queryKey: interactionKeys.drugSearch(keyword),
    queryFn: withApiTransform(() => searchDrugsRequest({ keyword })),
    enabled: enabled && keyword.trim().length > 1,
    staleTime: 5 * 60 * 1000,
  });

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
      queryClient.invalidateQueries({ queryKey: interactionKeys.lists() });
    },
  });
};
