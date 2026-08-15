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
 * Nút chuyển sáng/tối dùng chung cho khu protected app và cổng công khai (VinmecHeader);
 * action đầy đủ kèm nhãn nằm trong trang hồ sơ.
 *
 * Cổng công khai từng bị loại trừ vì `.landing-theme` khoá cứng bảng màu sáng. Khoá
 * đó đã gỡ — `.dark .landing-theme` trong globals.css nay cấp bảng màu tối cho cả ba
 * trang công khai, nên nút này có tác dụng ở mọi nơi.
 *
 * `className` chỉ đổi phần hình dáng (kích thước, bo góc, nền). Hành vi, nhãn và
 * `aria-pressed` giữ nguyên ở mọi chỗ dùng.
 */
export default function ThemeToggle({
  showLabel = false,
  className = "",
  variant = "button",
}: {
  showLabel?: boolean;
  className?: string;
  variant?: "button" | "switch";
}) {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";

  const toggle = () => {
    const next: TTheme = isDark ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    notify();
  };

  const shape =
    className ||
    `rounded-lg text-foreground-secondary hover:bg-surface hover:text-foreground ${
      showLabel ? "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium" : "p-2"
    }`;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${shape}`}
    >
      {variant === "switch" ? (
        showLabel ? (
          <Moon className="h-5 w-5" aria-hidden />
        ) : null
      ) : isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
      {showLabel ? (
        <span className="min-w-0 flex-1 text-left">
          {variant === "switch" ? "Giao diện tối" : isDark ? "Dùng giao diện sáng" : "Dùng giao diện tối"}
        </span>
      ) : null}
      {variant === "switch" ? (
        <span
          aria-hidden
          className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
            isDark ? "border-primary bg-primary" : "border-border bg-surface"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              isDark ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
      ) : null}
    </button>
  );
}
