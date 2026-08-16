"use client";

import { useCallback, useSyncExternalStore } from "react";

export const SIDEBAR_COLLAPSED_STORAGE_KEY = "medsafe-sidebar-collapsed";

/**
 * Bản sao trong bộ nhớ, dùng khi localStorage không khả dụng (chế độ riêng tư, cookie bị
 * chặn). Mất khi refresh nhưng vẫn cho phép đóng/mở trong phiên thay vì ném lỗi.
 */
let memoryCollapsed = false;

// Ghi localStorage ở chính tab hiện tại không bắn sự kiện `storage`, nên store tự thông
// báo cho các subscriber của mình — cùng pattern với ThemeToggle.
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function readCollapsed(): boolean {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored === "true" || stored === "false") {
      return stored === "true";
    }
  } catch {
    return memoryCollapsed;
  }
  return memoryCollapsed;
}

function writeCollapsed(next: boolean): void {
  memoryCollapsed = next;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
  } catch {
    // Không ghi được thì chỉ giữ trong `memoryCollapsed`; UI vẫn đổi trạng thái.
    memoryCollapsed = next;
  }
  listeners.forEach((callback) => callback());
}

// Server không đọc được localStorage nên luôn render sidebar ở trạng thái mở; ngay sau
// hydrate `useSyncExternalStore` đọc giá trị thật và React render lại đúng trạng thái.
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Trạng thái thu gọn của sidebar desktop, dùng chung cho `AppSidebar` và padding trái của
 * layout `(protected)` để hai bên không thể lệch nhau.
 */
export function useSidebarCollapsed(): { collapsed: boolean; toggle: () => void } {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, getServerSnapshot);
  const toggle = useCallback(() => writeCollapsed(!readCollapsed()), []);

  return { collapsed, toggle };
}
