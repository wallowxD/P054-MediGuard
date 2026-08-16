"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS, isNavItemActive } from "./nav-items";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-4 bottom-3 z-40 mx-auto max-w-md rounded-full liquid-glass-bar p-1.5 shadow-2xl lg:hidden"
    >
      <ul className="flex items-center justify-around">
        {BOTTOM_NAV_ITEMS.map(({ href, shortLabel, Icon }) => {
          const active = isNavItemActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 rounded-full py-1.5 text-center text-[10px] font-semibold transition-all ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
