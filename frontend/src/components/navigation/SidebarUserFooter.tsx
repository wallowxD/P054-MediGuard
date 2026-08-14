"use client";

import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface SidebarUserFooterProps {
  /** Gọi khi người dùng bấm một link — dùng để đóng drawer trên mobile */
  onNavigate?: () => void;
}

/** Toàn bộ hàng người dùng là một liên kết tới hồ sơ; action tài khoản nằm trong trang đó. */
export default function SidebarUserFooter({ onNavigate }: SidebarUserFooterProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || "Người dùng";
  const email = session?.user?.email || "Mở hồ sơ cá nhân";

  return (
    <div className="border-t border-border px-3 py-3">
      <Link
        href={ROUTES.SETTINGS}
        onClick={onNavigate}
        aria-label={`Mở hồ sơ của ${name}`}
        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-hero-tint text-sm font-semibold text-primary">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">{name}</span>
          <span className="mt-0.5 block truncate text-[11px] text-foreground-muted">{email}</span>
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 group-hover:text-foreground-secondary"
          aria-hidden
        />
      </Link>
    </div>
  );
}
