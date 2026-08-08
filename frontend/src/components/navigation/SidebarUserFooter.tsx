"use client";

import { LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import ThemeToggle from "./ThemeToggle";

interface SidebarUserFooterProps {
  /** Gọi khi người dùng bấm một link — dùng để đóng drawer trên mobile */
  onNavigate?: () => void;
}

/** Tên người dùng + Cài đặt + theme toggle + đăng xuất — dùng chung ở chân AppSidebar và drawer của MobileTopbar */
export default function SidebarUserFooter({ onNavigate }: SidebarUserFooterProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || "Người dùng";

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-medium text-foreground">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-foreground">{name}</span>
        <ThemeToggle />
        <Link
          href={ROUTES.SETTINGS}
          onClick={onNavigate}
          aria-label="Cài đặt"
          title="Cài đặt"
          className="shrink-0 rounded-lg p-2 text-foreground-secondary hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: ROUTES.SIGNIN })}
          aria-label="Đăng xuất"
          title="Đăng xuất"
          className="shrink-0 rounded-lg p-2 text-foreground-secondary hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
