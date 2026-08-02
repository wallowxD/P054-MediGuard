"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/ui/Logo";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import { SEO_CONFIG } from "@/config/seo-config";

const NAV = [
  { href: LANDING_SECTIONS.FEATURES, label: "Tính năng" },
  { href: LANDING_SECTIONS.HOW_IT_WORKS, label: "Cách hoạt động" },
  { href: LANDING_SECTIONS.SAFETY, label: "An toàn sử dụng" },
];

export default function LandingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={ROUTES.HOME}
          className="flex shrink-0 items-center gap-2.5 text-primary"
        >
          <Logo className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-tight text-foreground">
            {SEO_CONFIG.brandName}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-foreground-secondary transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href={ROUTES.SIGNIN}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Đăng nhập
          </Link>
          <Link
            href={ROUTES.SIGNUP}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Đăng ký
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Đóng menu" : "Mở menu"}
          className="rounded-lg p-2 text-foreground-secondary hover:bg-surface md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2" aria-label="Điều hướng chính">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-foreground-secondary hover:text-primary"
              >
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 py-3">
              <Link
                href={ROUTES.SIGNIN}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-center text-sm font-medium text-foreground"
              >
                Đăng nhập
              </Link>
              <Link
                href={ROUTES.SIGNUP}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
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
