"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import SidebarHistory from "./SidebarHistory";
import SidebarNavList from "./SidebarNavList";
import SidebarUserFooter from "./SidebarUserFooter";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

/**
 * Sidebar trái cố định — chỉ hiển thị từ `lg:` trở lên, thay cho AppHeader cũ.
 *
 * Thu gọn được về dải icon: trạng thái nằm trong `useSidebarCollapsed()` nên giữ nguyên
 * khi chuyển route và persist qua refresh. Mobile/tablet vẫn dùng drawer của
 * `MobileTopbar`, không chịu ảnh hưởng của trạng thái này.
 */
export default function AppSidebar() {
  const { collapsed, toggle } = useSidebarCollapsed();
  const toggleLabel = collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng";

  return (
    <aside
      id="app-sidebar"
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border bg-background-elevated transition-[width] duration-200 ease-out lg:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo và nút thu gọn nằm chung một hàng. Khi thu gọn, dải 4rem không đủ chỗ cho cả
          hai nên chỉ giữ lại nút — logo là link tới dashboard, mà mục "Trang chủ" ngay dưới
          đã dẫn tới đúng chỗ đó. */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-border ${
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"
        }`}
      >
        {collapsed ? null : (
          <Link
            href={ROUTES.DASHBOARD}
            className="flex min-w-0 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo className="h-11 w-auto" />
          </Link>
        )}

        <button
          type="button"
          onClick={toggle}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={toggleLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto overflow-x-hidden px-3 py-4">
        <SidebarNavList collapsed={collapsed} />

        <SidebarHistory collapsed={collapsed} />
      </div>

      <SidebarUserFooter collapsed={collapsed} />
    </aside>
  );
}
