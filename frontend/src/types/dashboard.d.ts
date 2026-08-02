export {};

declare global {
  /** Số liệu tổng quan hiển thị ở /dashboard */
  interface IDashboardStats {
    trackedDrugs: number;
    totalInteractions: number;
    /** Cảnh báo chờ dược sĩ duyệt — VẪN đang hiển thị cho người dùng */
    pendingReview: number;
    bySeverity: Record<TSeverity, number>;
  }

  interface IDashboardResponse {
    stats: IDashboardStats;
    recentInteractions: IInteractionItem[];
  }
}
