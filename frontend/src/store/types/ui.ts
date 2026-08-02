export interface IUiState {
  sidebarOpen: boolean;
  /** Bộ lọc đang chọn ở màn danh sách cảnh báo — client state, không phải data API */
  severityFilter: TSeverity | "all";
  reviewStatusFilter: TReviewStatus | "all";
}
