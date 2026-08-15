"use client";

import { Calendar, ShieldAlert, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

export default function WelcomeHero() {
  const { data: session } = useSession();
  const name = session?.user?.name || "bạn";

  const todayStr = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8">
      {/* Ambient decorative glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="capitalize">{todayStr}</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Chào mừng trở lại, {name}
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary">
            Không gian tra cứu an toàn thuốc và quản lý dữ liệu lâm sàng cá nhân.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl liquid-glass-subtle px-3.5 py-2 text-xs text-foreground-muted">
          <ShieldAlert className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Thông tin tham khảo y tế chính thống từ tờ HDSD</span>
        </div>
      </div>
    </div>
  );
}
