"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export function ReviewHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-elevated">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Về ứng dụng</span>
          </Link>
          <span className="font-semibold text-foreground">Khu duyệt của dược sĩ</span>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link href={ROUTES.REVIEW_QUEUE} className="text-foreground-secondary hover:text-foreground">
            Hàng đợi
          </Link>
        </nav>
      </div>
    </header>
  );
}
