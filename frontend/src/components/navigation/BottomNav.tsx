"use client";

import { LayoutDashboard, Pill, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";

const ITEMS = [
  { href: ROUTES.DASHBOARD, label: "Tổng quan", Icon: LayoutDashboard },
  { href: ROUTES.INTERACTIONS, label: "Tra tương tác", Icon: Pill },
  { href: ROUTES.SETTINGS, label: "Cài đặt", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background-elevated lg:hidden">
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-xs ${
                  active ? "text-primary" : "text-foreground-muted"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
