"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";

/**
 * Tạo store một lần cho mỗi lần render đầu — KHÔNG đặt ở module scope, nếu không
 * mọi request SSR dùng chung một store.
 *
 * Cách thông thường là `useRef`. Trên React 19 + Next 16,
 * rule `react-hooks/refs` báo lỗi "Cannot access refs during render". Dùng
 * `useState` với lazy initializer đạt đúng mục đích và hợp lệ với React Compiler.
 */
export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);

  return <Provider store={store}>{children}</Provider>;
}
