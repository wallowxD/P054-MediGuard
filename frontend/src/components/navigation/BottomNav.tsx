"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS, isNavItemActive } from "./nav-items";

/** Điều hướng nhanh trên mobile — chỉ giữ các mục cốt lõi, danh sách đầy đủ nằm ở drawer của MobileTopbar */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background-elevated lg:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {BOTTOM_NAV_ITEMS.map(({ href, shortLabel, Icon }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-center text-[11px] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                  active ? "text-primary" : "text-foreground-muted"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {shortLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
