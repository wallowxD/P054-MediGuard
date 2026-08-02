import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { drugBasketInitialState } from "../initialState";

const drugBasketSlice = createSlice({
  name: "drugBasket",
  initialState: drugBasketInitialState,
  reducers: {
    addDrug: (state, action: PayloadAction<IDrugItem>) => {
      if (state.items.some((d) => d.id === action.payload.id)) return;
      state.items.push(action.payload);
    },
    removeDrug: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((d) => d.id !== action.payload);
    },
    addFood: (state, action: PayloadAction<string>) => {
      const food = action.payload.trim();
      if (!food || state.foods.includes(food)) return;
      state.foods.push(food);
    },
    removeFood: (state, action: PayloadAction<string>) => {
      state.foods = state.foods.filter((f) => f !== action.payload);
    },
    clearBasket: () => drugBasketInitialState,
  },
});

export const { addDrug, removeDrug, addFood, removeFood, clearBasket } =
  drugBasketSlice.actions;

export default drugBasketSlice.reducer;
