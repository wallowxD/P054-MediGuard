"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "medsafe-theme";
type TTheme = "light" | "dark";

function getSystemTheme(): TTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readTheme(): TTheme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : getSystemTheme();
}

function applyTheme(theme: TTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

// Không có sự kiện storage nào bắn khi tab hiện tại tự ghi localStorage, nên nút
// tự thông báo cho chính nó qua listener nội bộ — tránh gọi setState trong effect.
const listeners = new Set<() => void>();
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
function notify() {
  listeners.forEach((callback) => callback());
}

// Khớp với `THEME_INIT_SCRIPT` trong app/layout.tsx: server luôn render "light",
// client đồng bộ lại giá trị thật ngay sau hydrate qua useSyncExternalStore.
function getServerSnapshot(): TTheme {
  return "light";
}

/**
 * Nút chuyển sáng/tối cho khu protected app — action đầy đủ nằm trong trang hồ sơ.
 * Landing page công khai không đọc `.dark`/`.light`
 * trên `<html>` (xem `.landing-theme` trong globals.css) nên không bị ảnh hưởng.
 */
export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";

  const toggle = () => {
    const next: TTheme = isDark ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    notify();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`shrink-0 rounded-lg text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        showLabel ? "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium" : "p-2"
      }`}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
      {showLabel ? <span>{isDark ? "Dùng giao diện sáng" : "Dùng giao diện tối"}</span> : null}
    </button>
  );
}
