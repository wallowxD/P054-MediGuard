"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavListProps {
  /** Gọi khi người dùng bấm một link — dùng để đóng drawer trên mobile */
  onNavigate?: () => void;
}

/** Danh sách 5 mục điều hướng chính — dùng chung cho AppSidebar (desktop) và drawer của MobileTopbar */
export default function SidebarNavList({ onNavigate }: SidebarNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
      {PRIMARY_NAV_ITEMS.map(({ href, label, Icon, unsupported }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? "bg-surface text-primary"
                : "text-foreground-secondary hover:bg-surface hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
            {unsupported ? (
              <span className="shrink-0 rounded-full border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground-secondary">
                Chưa hỗ trợ
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
