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
    <nav aria-label="Điều hướng chính">
      {collapsed ? null : (
        <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
          Tra cứu
        </p>
      )}

      <div className="flex flex-col gap-1">
        {PRIMARY_NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              className={`flex h-11 items-center rounded-xl text-sm transition-colors duration-200 ${
                collapsed ? "mx-auto w-11 justify-center" : "gap-3 px-3"
              } ${
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "font-medium text-foreground-secondary hover:bg-surface/70 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
