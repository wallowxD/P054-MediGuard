import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { uiInitialState } from "../initialState";

const uiSlice = createSlice({
  name: "ui",
  initialState: uiInitialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setSeverityFilter: (state, action: PayloadAction<TSeverity | "all">) => {
      state.severityFilter = action.payload;
    },
    setReviewStatusFilter: (state, action: PayloadAction<TReviewStatus | "all">) => {
      state.reviewStatusFilter = action.payload;
    },
    resetFilters: (state) => {
      state.severityFilter = "all";
      state.reviewStatusFilter = "all";
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setSeverityFilter,
  setReviewStatusFilter,
  resetFilters,
} = uiSlice.actions;

export default uiSlice.reducer;
