"use client";

import { Tooltip } from "react-tooltip";

/**
 * Tooltip dùng chung, ăn theo CSS variable của theme nên tự đổi màu ở dark mode.
 * Dùng: <span data-tooltip-id="app-tooltip" data-tooltip-content="...">
 * rồi đặt <ThemedTooltip /> một lần trong layout.
 */
export default function ThemedTooltip({ id = "app-tooltip" }: { id?: string }) {
  return (
    <Tooltip
      id={id}
      style={{
        backgroundColor: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        fontSize: "0.75rem",
        maxWidth: "18rem",
      }}
    />
  );
}
