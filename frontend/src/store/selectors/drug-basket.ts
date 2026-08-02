import type { RootState } from "../index";

export const selectBasketDrugs = (state: RootState) => state.drugBasket.items;
export const selectBasketFoods = (state: RootState) => state.drugBasket.foods;
export const selectBasketCount = (state: RootState) => state.drugBasket.items.length;

/** Cần ít nhất 2 thuốc mới sinh được cặp để tra tương tác thuốc–thuốc */
export const selectCanCheckInteractions = (state: RootState) =>
  state.drugBasket.items.length >= 2 || state.drugBasket.foods.length > 0;
