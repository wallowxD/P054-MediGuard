import type { RootState } from "../index";

export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectSeverityFilter = (state: RootState) => state.ui.severityFilter;
export const selectReviewStatusFilter = (state: RootState) => state.ui.reviewStatusFilter;
