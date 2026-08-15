"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavListProps {
  /** Gọi khi người dùng bấm một link — dùng để đóng drawer trên mobile */
  onNavigate?: () => void;
  /** Sidebar desktop đang thu gọn: chỉ hiện icon, nhãn giữ lại cho screen reader */
  collapsed?: boolean;
}

/** Danh sách điều hướng chính — dùng chung cho AppSidebar và drawer mobile. */
export default function SidebarNavList({ onNavigate, collapsed = false }: SidebarNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
      {PRIMARY_NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={`flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              collapsed ? "justify-center px-0" : "gap-3 px-3"
            } ${
              active
                ? "bg-surface text-primary"
                : "text-foreground-secondary hover:bg-surface hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {/* Khi thu gọn, nhãn vẫn nằm trong DOM để link có accessible name. */}
            <span className={collapsed ? "sr-only" : "flex-1"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
