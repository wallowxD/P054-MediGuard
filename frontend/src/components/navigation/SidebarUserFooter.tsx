"use client";

import { ChevronRight, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface SidebarUserFooterProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

export default function SidebarUserFooter({
  onNavigate,
  collapsed = false,
}: SidebarUserFooterProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || "Người dùng";
  const email = session?.user?.email || "Hồ sơ cá nhân";

  return (
    <div className={`border-t border-border/60 p-3 ${collapsed ? "flex justify-center" : ""}`}>
      <Link
        href={ROUTES.SETTINGS}
        onClick={onNavigate}
        aria-label={`Mở hồ sơ của ${name}`}
        title={collapsed ? name : undefined}
        className={`group flex items-center rounded-2xl p-2 transition-all duration-200 hover:bg-surface/80 ${
          collapsed ? "justify-center" : "gap-3 w-full"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-sky-400 text-xs font-bold text-white shadow-sm">
          {name.charAt(0).toUpperCase()}
        </span>
        {collapsed ? null : (
          <>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-foreground">{name}</span>
              <span className="block truncate text-[10px] text-foreground-muted">
                {email}
              </span>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </>
        )}
      </Link>
    </div>
  );
}
