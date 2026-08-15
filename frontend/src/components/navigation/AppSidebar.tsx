"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import SidebarHistory from "./SidebarHistory";
import SidebarNavList from "./SidebarNavList";
import SidebarUserFooter from "./SidebarUserFooter";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

export default function AppSidebar() {
  const { collapsed, toggle } = useSidebarCollapsed();
  const toggleLabel = collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng";

  return (
    <aside
      id="app-sidebar"
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col liquid-glass-bar border-r border-border/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header with Logo & Toggle */}
      <div
        className={`flex h-16 shrink-0 items-center border-b border-border/60 ${
          collapsed ? "justify-between px-3" : "justify-between gap-2 px-5"
        }`}
      >
        <Link
          href={ROUTES.HOME}
          title="Trang chủ Vinmec"
          aria-label="Vinmec — về trang chủ"
          className="flex min-w-0 items-center transition-opacity hover:opacity-85"
        >
          <Logo className={collapsed ? "h-7 w-auto" : "h-9 w-auto"} />
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={toggleLabel}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full liquid-glass-pill text-foreground-secondary hover:text-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto overflow-x-hidden px-3 py-5">
        <SidebarNavList collapsed={collapsed} />

        <SidebarHistory collapsed={collapsed} />
      </div>

      <SidebarUserFooter collapsed={collapsed} />
    </aside>
  );
}
