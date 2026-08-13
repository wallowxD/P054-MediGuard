"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavListProps {
  /** Gọi khi người dùng bấm một link — dùng để đóng drawer trên mobile */
  onNavigate?: () => void;
}

/** Danh sách điều hướng chính — dùng chung cho AppSidebar và drawer mobile. */
export default function SidebarNavList({ onNavigate }: SidebarNavListProps) {
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
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active
                ? "bg-surface text-primary"
                : "text-foreground-secondary hover:bg-surface hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
