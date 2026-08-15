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
      className={`fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/80 bg-background-elevated shadow-[0_0_32px_rgba(15,23,42,0.06)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:shadow-[0_0_36px_rgba(0,0,0,0.28)] lg:flex ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header with Logo & Toggle */}
      <div
        className={`relative flex h-24 shrink-0 items-center border-b border-border/70 ${
          collapsed ? "justify-center px-2" : "px-6"
        }`}
      >
        <Link
          href={ROUTES.HOME}
          title="Trang chủ Vinmec"
          aria-label="Vinmec — về trang chủ"
          className="flex min-w-0 items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <span className="flex h-11 w-11 items-start justify-center overflow-hidden" aria-hidden>
              <Logo className="h-[5.25rem] w-auto max-w-none shrink-0" />
            </span>
          ) : (
            <Logo className="h-12 w-auto" />
          )}
        </Link>

        <button
          type="button"
          onClick={toggle}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
          title={toggleLabel}
          className={`z-10 flex h-10 w-8 items-center justify-center rounded-lg border border-border/80 bg-background-elevated text-foreground-secondary transition-[color,background-color,transform] hover:bg-surface hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            collapsed
              ? "absolute right-0 top-7 translate-x-1/2 shadow-[0_6px_18px_rgba(15,23,42,0.12)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
              : "ml-auto shadow-sm"
          }`}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-3 py-5">
        <SidebarNavList collapsed={collapsed} />
        <SidebarHistory collapsed={collapsed} />
      </div>

      <SidebarUserFooter collapsed={collapsed} />
    </aside>
  );
}
