import { combineReducers } from "@reduxjs/toolkit";
import drugBasketReducer from "./drug-basket";
import uiReducer from "./ui";

const rootReducer = combineReducers({
  ui: uiReducer,
  drugBasket: drugBasketReducer,
});

export default rootReducer;

export * from "./drug-basket";
export * from "./ui";
