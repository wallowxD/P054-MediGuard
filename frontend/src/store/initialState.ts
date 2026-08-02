import type { IDrugBasketState, IUiState } from "./types";

export const uiInitialState: IUiState = {
  sidebarOpen: false,
  severityFilter: "all",
  reviewStatusFilter: "all",
};

export const drugBasketInitialState: IDrugBasketState = {
  items: [],
  foods: [],
};
