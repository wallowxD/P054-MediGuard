"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Logo from "@/components/ui/Logo";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import { useSectionSpy } from "./use-section-spy";

const LINK_FOCUS =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * Header chỉ render trên "/" nên mọi mục nav đều là neo trong trang, kể cả
 * "Trang chủ" (neo tới hero). "Liên hệ" trỏ tới footer `#lien-he`.
 *
 * Hằng số ở module scope, không dựng lại mỗi render — `useSectionSpy` dùng chính
 * mảng này làm dependency của observer.
 */
const NAV = [
  { href: LANDING_SECTIONS.HOME, label: "Trang chủ" },
  { href: LANDING_SECTIONS.FEATURES, label: "Tính năng" },
  { href: LANDING_SECTIONS.HOW_IT_WORKS, label: "Cách hoạt động" },
  { href: LANDING_SECTIONS.CONTACT, label: "Liên hệ" },
] as const;

const SECTION_IDS = NAV.map((item) => item.href.slice(1));

export default function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { activeId, scrollToSection } = useSectionSpy(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // `href` vẫn là neo thật để link hoạt động cả khi JS chưa chạy; chỉ chặn hành vi
  // mặc định để tự cuộn có bù offset header và chuyển active state tức thì.
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    setOpen(false);
    scrollToSection(id);
  };

  return (
    <header className="sticky top-3 z-50 sm:top-4">
      <div className="landing-wide-container">
        <div
          className={`border border-border bg-background/95 backdrop-blur-md transition-[box-shadow,border-radius] duration-300 ${
            open ? "rounded-[28px]" : "rounded-full"
          } ${scrolled ? "shadow-md shadow-foreground/[0.08]" : "shadow-sm shadow-foreground/[0.04]"}`}
        >
          <div className="relative flex h-16 items-center justify-between px-4 sm:px-6">
            <Link
              href={ROUTES.HOME}
              className={`flex shrink-0 items-center gap-2.5 text-primary ${LINK_FOCUS}`}
            >
              <Logo className="h-9 w-auto" />
            </Link>

            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 lg:flex"
              aria-label="Điều hướng chính"
            >
              {NAV.map((item) => {
                const id = item.href.slice(1);
                const active = activeId === id;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(event) => handleNavClick(event, id)}
                    aria-current={active ? "page" : undefined}
                    className={`border-b-2 pb-0.5 text-[15px] transition-colors ${LINK_FOCUS} ${
                      active
                        ? "border-[var(--cta-accent)] text-foreground"
                        : "border-transparent text-foreground-secondary hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <div className="hidden items-center gap-5 lg:flex">
              <Link
                href={ROUTES.SIGNIN}
                className={`text-[15px] text-foreground-secondary transition-colors hover:text-primary ${LINK_FOCUS}`}
              >
                Đăng nhập
              </Link>
              <Button href={ROUTES.SIGNUP} variant="accent" size="sm">
                Đăng ký
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Đóng menu" : "Mở menu"}
              className={`flex h-11 w-11 items-center justify-center rounded-full text-foreground-secondary hover:bg-surface lg:hidden ${LINK_FOCUS}`}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {open ? (
            <div className="border-t border-border lg:hidden">
              <nav className="flex flex-col px-4 py-2" aria-label="Điều hướng chính">
                {/* Drawer mobile dùng chung `activeId` với nav desktop — một nguồn sự thật */}
                {NAV.map((item) => {
                  const id = item.href.slice(1);
                  const active = activeId === id;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(event) => handleNavClick(event, id)}
                      aria-current={active ? "page" : undefined}
                      className={`border-l-2 py-3 pl-3 text-sm ${LINK_FOCUS} ${
                        active
                          ? "border-[var(--cta-accent)] font-medium text-primary"
                          : "border-transparent text-foreground-secondary hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </a>
                  );
                })}
                <Link
                  href={ROUTES.SIGNIN}
                  onClick={() => setOpen(false)}
                  className={`py-3 pl-3 text-sm text-foreground-secondary hover:text-primary ${LINK_FOCUS}`}
                >
                  Đăng nhập
                </Link>
                <div className="flex flex-col gap-3 py-3">
                  <Button href={ROUTES.SIGNUP} variant="accent" size="sm" className="w-full">
                    Đăng ký
                  </Button>
                  <Button href={ROUTES.SIGNIN} variant="outline" size="sm" className="w-full">
                    Tra cứu thuốc ngay
                  </Button>
                </div>
              </nav>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
