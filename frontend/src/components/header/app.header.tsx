"use client";

import { LogOut, ShieldCheck } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { ROLES, ROUTES } from "@/constants/routes";
import PermissionGuard from "@/components/PermissionGuard";

export function AppHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background-elevated/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href={ROUTES.DASHBOARD} className="font-semibold text-foreground">
          MedSafe
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href={ROUTES.INTERACTIONS}
            className="hidden text-sm text-foreground-secondary hover:text-foreground sm:block"
          >
            Tra tương tác
          </Link>

          {/* Chỉ dược sĩ mới thấy lối vào khu duyệt — middleware vẫn là lớp chặn thật */}
          <PermissionGuard roles={[ROLES.PHARMACIST]}>
            <Link
              href={ROUTES.REVIEW}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Khu duyệt</span>
            </Link>
          </PermissionGuard>

          <span className="hidden text-sm text-foreground-muted md:inline">
            {session?.user?.name}
          </span>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: ROUTES.SIGNIN })}
            className="rounded-lg p-2 text-foreground-secondary hover:bg-surface hover:text-foreground"
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </nav>
      </div>
    </header>
  );
}
