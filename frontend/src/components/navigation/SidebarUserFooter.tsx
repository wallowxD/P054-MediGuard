"use client";

import { LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { isNavItemActive } from "./nav-items";
import ThemeToggle from "./ThemeToggle";

interface SidebarUserFooterProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function SidebarUserFooter({
  onNavigate,
  collapsed = false,
}: SidebarUserFooterProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const name = session?.user?.name || "Người dùng";
  const email = session?.user?.email || "Hồ sơ cá nhân";
  const settingsActive = isNavItemActive(pathname, ROUTES.SETTINGS);

  return (
    <div className="border-t border-border/70 px-3 pb-3 pt-4">
      {collapsed ? null : (
        <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
          Hệ thống
        </p>
      )}

      <div className="space-y-1">
        <Link
          href={ROUTES.SETTINGS}
          onClick={onNavigate}
          title={collapsed ? "Cài đặt" : undefined}
          aria-current={settingsActive ? "page" : undefined}
          className={`flex h-11 items-center rounded-xl text-sm transition-colors ${
            collapsed ? "mx-auto w-11 justify-center" : "gap-3 px-3"
          } ${
            settingsActive
              ? "bg-primary/10 font-semibold text-primary"
              : "font-medium text-foreground-secondary hover:bg-surface/70 hover:text-foreground"
          }`}
        >
          <Settings className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className={collapsed ? "sr-only" : "min-w-0 flex-1 truncate"}>Cài đặt</span>
        </Link>

        <ThemeToggle
          variant="switch"
          showLabel={!collapsed}
          className={
            collapsed
              ? "mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-foreground-secondary hover:bg-surface/70 hover:text-foreground"
              : "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground-secondary hover:bg-surface/70 hover:text-foreground"
          }
        />
      </div>

      <div className="mt-4 border-t border-border/70 pt-4">
        <div
          aria-label={`${name}, ${email}`}
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-2 py-2"}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
            {name.charAt(0).toUpperCase()}
          </span>
          {collapsed ? null : (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
              <span className="mt-0.5 block truncate text-[10px] text-foreground-muted">
                {email}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            void signOut({ callbackUrl: ROUTES.SIGNIN });
          }}
          title={collapsed ? "Đăng xuất" : undefined}
          className={`mt-1 flex h-11 items-center rounded-xl text-sm font-medium text-foreground-secondary transition-colors hover:bg-surface/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            collapsed ? "mx-auto w-11 justify-center" : "w-full gap-3 px-3"
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span className={collapsed ? "sr-only" : "min-w-0 flex-1 text-left"}>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
