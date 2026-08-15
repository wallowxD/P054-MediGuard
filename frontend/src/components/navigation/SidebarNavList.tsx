"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarNavListProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function SidebarNavList({ onNavigate, collapsed = false }: SidebarNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-1.5">
      {PRIMARY_NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? label : undefined}
            className={`flex items-center rounded-2xl py-2.5 text-xs font-semibold transition-all duration-200 ${
              collapsed ? "justify-center px-0 h-11 w-11 mx-auto" : "gap-3 px-3.5"
            } ${
              active
                ? "bg-primary text-white shadow-[0_4px_14px_rgba(0,102,204,0.35)]"
                : "text-foreground-secondary hover:bg-surface/80 hover:text-foreground"
            }`}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
            <span className={collapsed ? "sr-only" : "flex-1 truncate"}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
