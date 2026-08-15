"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { isNavItemActive } from "./nav-items";

interface SidebarHistoryProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function SidebarHistory({ onNavigate, collapsed = false }: SidebarHistoryProps) {
  const pathname = usePathname();
  const active = isNavItemActive(pathname, ROUTES.HISTORY);

  return (
    <nav aria-label="Lịch sử" className="mt-5 border-t border-border/70 pt-5">
      {collapsed ? null : (
        <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
          Hoạt động
        </p>
      )}

      <Link
        href={ROUTES.HISTORY}
        onClick={onNavigate}
        title={collapsed ? "Lịch sử tra cứu" : undefined}
        aria-current={active ? "page" : undefined}
        className={`flex h-11 items-center rounded-xl text-sm transition-colors ${
          collapsed ? "mx-auto w-11 justify-center" : "gap-3 px-3"
        } ${
          active
            ? "bg-primary/10 font-semibold text-primary"
            : "font-medium text-foreground-secondary hover:bg-surface/70 hover:text-foreground"
        }`}
      >
        <History className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>
          Lịch sử tra cứu
        </span>
      </Link>
    </nav>
  );
}
