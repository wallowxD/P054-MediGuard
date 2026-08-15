"use client";

import { CalendarDays, Menu, Search, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { VINMEC_NAV } from "./vinmec-content";

export default function VinmecHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full px-3 py-3 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-3xl liquid-glass-bar px-4 py-2.5 sm:px-6">
        {/* Logo */}
        <Link
          href={ROUTES.HOME}
          aria-label="Vinmec — về trang chủ"
          className="flex shrink-0 items-center transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Image
            src="/images/vinmec/logo.svg"
            alt="Vinmec Healthcare System"
            width={120}
            height={70}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        {/* Desktop Nav Links (Apple Segmented Glass Capsule) */}
        <nav
          className="hidden items-center gap-1 rounded-full border border-border/60 bg-surface/60 p-1 backdrop-blur-md lg:flex"
          aria-label="Điều hướng chính"
        >
          {VINMEC_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-white text-primary shadow-sm dark:bg-card dark:text-primary"
                    : "text-foreground-secondary hover:text-foreground hover:bg-white/40 dark:hover:bg-white/5"
                }`}
              >
                {item.href === ROUTES.FEATURE ? (
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Glass Pill */}
          <div className="relative hidden w-44 xl:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted"
              aria-hidden
            />
            <input
              type="text"
              placeholder="Tra cứu thuốc..."
              aria-label="Tìm kiếm thuốc và tài liệu y tế"
              className="w-full rounded-full border border-border/70 bg-surface/50 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-muted backdrop-blur-sm transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            aria-label="Đặt lịch hẹn"
            title="Đặt lịch khám y tế"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/50 text-foreground-secondary backdrop-blur-sm transition-all hover:bg-surface hover:text-primary md:flex"
          >
            <CalendarDays className="h-4 w-4" aria-hidden />
          </button>

          <Link
            href={ROUTES.SIGNIN}
            className="hidden rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:text-foreground md:block"
          >
            Đăng nhập
          </Link>

          <Link
            href={ROUTES.SIGNUP}
            className="rounded-full bg-gradient-to-b from-[#0077ed] to-[#0066cc] px-4 py-2 text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,102,204,0.3)] transition-all hover:brightness-105 hover:shadow-[0_6px_16px_rgba(0,102,204,0.4)] active:scale-95"
          >
            Bắt đầu tra cứu
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/50 text-foreground transition-colors hover:bg-surface lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Glass Menu Drawer */}
      {mobileOpen ? (
        <div className="mx-auto mt-2 max-w-7xl rounded-3xl liquid-glass p-5 lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1.5" aria-label="Điều hướng mobile">
            {VINMEC_NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground-secondary hover:bg-surface hover:text-foreground"
                  }`}
                >
                  {item.href === ROUTES.FEATURE ? (
                    <Sparkles className="h-4 w-4 text-primary" />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-3 flex gap-2 border-t border-border/60 pt-3">
              <Link
                href={ROUTES.SIGNIN}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-full border border-border/80 bg-surface/50 py-2.5 text-center text-xs font-semibold text-foreground transition-colors hover:bg-surface"
              >
                Đăng nhập
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-full bg-gradient-to-b from-[#0077ed] to-[#0066cc] py-2.5 text-center text-xs font-semibold text-white shadow-md"
              >
                Đăng ký
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
