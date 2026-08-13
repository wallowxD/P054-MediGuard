"use client";

import { CalendarDays, ChevronDown, Menu, Search, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/routes";
import { DEAD_LINK, VINMEC_NAV, VINMEC_TOPBAR_LINKS } from "./vinmec-content";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-1";
const FOCUS_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)] focus-visible:ring-offset-2";

/**
 * Header của cổng Vinmec mô phỏng — ba tầng đúng bản gốc:
 *   1. thanh trên nền gradient xanh (link phụ + chuyển ngữ)
 *   2. hàng logo + ô tìm kiếm + icon đặt lịch + cờ
 *   3. thanh nav chính, căn giữa
 *
 * ★ Chỉ mục "MediGuard" là link thật. Mọi mục còn lại trỏ `#` — đây là bản dựng
 *   giao diện để demo luồng, không phải cổng Vinmec hoạt động được.
 *
 * Trạng thái active của MediGuard dò bằng `usePathname()` chứ không hardcode: nếu
 * sau này header được render trên chính trang MediGuard thì mục đó tự sáng, không
 * phải sửa thêm chỗ nào.
 */
export default function VinmecHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();

  const isMediGuardActive = pathname === ROUTES.HOME;

  return (
    <header className="relative z-50 bg-white">
      {/* ── Tầng 1: thanh gradient ─────────────────────────────────────── */}
      <div className="vinmec-topbar">
        <div className="vinmec-container flex h-9 items-center justify-end gap-5 text-[12px] text-white">
          {VINMEC_TOPBAR_LINKS.map((label) => (
            <a
              key={label}
              href={DEAD_LINK}
              className={`hidden transition-opacity hover:opacity-80 sm:block ${FOCUS}`}
            >
              {label}
            </a>
          ))}
          <span className="hidden h-3 w-px bg-white/40 sm:block" aria-hidden="true" />
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">🇻🇳</span>
            <span>Tiếng Việt</span>
          </span>
        </div>
      </div>

      {/* ── Tầng 2: logo + tìm kiếm ────────────────────────────────────── */}
      <div className="vinmec-container flex h-[68px] items-center gap-4">
        <Link
          href={ROUTES.VINMEC}
          aria-label="Vinmec — về trang chủ"
          className={`shrink-0 rounded-sm ${FOCUS_DARK}`}
        >
          <Image
            src="/images/vinmec/logo.svg"
            alt="Vinmec Healthcare System"
            width={128}
            height={80}
            priority
            className="h-[50px] w-auto"
          />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Ô tìm kiếm chỉ là giao diện — không submit, không gọi API. */}
          <div className="relative hidden w-full max-w-[220px] md:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aaa]"
              aria-hidden="true"
            />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              aria-label="Tìm kiếm (giao diện trình diễn, chưa hoạt động)"
              className={`w-full rounded-[10px] border border-[#ccc] py-2 pl-9 pr-3 text-sm text-[var(--vm-text)] placeholder:text-[#aaa] ${FOCUS_DARK}`}
            />
          </div>

          <button
            type="button"
            aria-label="Đặt lịch hẹn"
            className={`hidden h-9 w-9 items-center justify-center rounded-md border border-[var(--vm-border)] text-[var(--vm-menu-blue)] transition-colors hover:bg-[var(--vm-gray-bg)] md:flex ${FOCUS_DARK}`}
          >
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            className={`flex h-10 w-10 items-center justify-center rounded-md text-[var(--vm-text)] transition-colors hover:bg-[var(--vm-gray-bg)] lg:hidden ${FOCUS_DARK}`}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* ── Tầng 3: nav chính (desktop) ────────────────────────────────── */}
      <div className="hidden border-t border-[var(--vm-border)] lg:block">
        <nav className="vinmec-container flex items-center justify-center" aria-label="Điều hướng chính">
          {VINMEC_NAV.map((item) => {
            if (item.highlight) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isMediGuardActive ? "page" : undefined}
                  className={`my-2 ml-2 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${FOCUS_DARK} ${
                    isMediGuardActive
                      ? "bg-[var(--vm-blue)] text-white"
                      : "bg-[var(--vm-gray-bg)] text-[var(--vm-menu-blue)] ring-1 ring-[var(--vm-menu-blue)]/30 hover:bg-[var(--vm-menu-blue)] hover:text-white hover:ring-transparent"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.label} className="group relative">
                <a
                  href={item.href}
                  className={`flex items-center gap-1 px-4 py-3.5 text-[13px] text-[var(--vm-text)] transition-colors hover:text-[var(--vm-menu-blue)] group-focus-within:text-[var(--vm-menu-blue)] ${FOCUS_DARK}`}
                >
                  {item.label}
                  {item.children ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                  ) : null}
                </a>

                {/* Dropdown thuần CSS: hiện khi hover HOẶC khi có focus bên trong,
                    nên bàn phím dùng được mà không cần thêm state. */}
                {item.children ? (
                  <div className="pointer-events-none invisible absolute left-0 top-full z-50 w-64 rounded-md border border-[var(--vm-border)] bg-white py-2 opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
                    {item.children.map((child) => (
                      <a
                        key={child}
                        href={DEAD_LINK}
                        className={`block px-4 py-2 text-[13px] text-[var(--vm-text)] transition-colors hover:bg-[var(--vm-gray-bg)] hover:text-[var(--vm-menu-blue)] ${FOCUS_DARK}`}
                      >
                        {child}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      {/* ── Menu mobile ────────────────────────────────────────────────── */}
      {mobileOpen ? (
        <div className="border-t border-[var(--vm-border)] bg-white lg:hidden">
          <nav className="vinmec-container py-2" aria-label="Điều hướng chính">
            <div className="relative mb-3 mt-2 md:hidden">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#aaa]"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm (giao diện trình diễn, chưa hoạt động)"
                className={`w-full rounded-[10px] border border-[#ccc] py-2 pl-9 pr-3 text-sm placeholder:text-[#aaa] ${FOCUS_DARK}`}
              />
            </div>

            {VINMEC_NAV.map((item) => {
              // MediGuard đứng riêng ở cuối: link thật, luôn hiển thị, không gập vào
              // submenu nào — trên mobile nó vẫn phải bấm được ngay.
              if (item.highlight) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isMediGuardActive ? "page" : undefined}
                    className={`my-3 block rounded-full px-4 py-2.5 text-center text-sm font-semibold transition-colors ${FOCUS_DARK} ${
                      isMediGuardActive
                        ? "bg-[var(--vm-blue)] text-white"
                        : "bg-[var(--vm-menu-blue)] text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              }

              if (!item.children) {
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`block border-b border-[var(--vm-border)] py-3 text-sm text-[var(--vm-text)] ${FOCUS_DARK}`}
                  >
                    {item.label}
                  </a>
                );
              }

              const expanded = openGroup === item.label;
              return (
                <div key={item.label} className="border-b border-[var(--vm-border)]">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(expanded ? null : item.label)}
                    aria-expanded={expanded}
                    className={`flex w-full items-center justify-between py-3 text-left text-sm text-[var(--vm-text)] ${FOCUS_DARK}`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 opacity-60 transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {expanded ? (
                    <div className="pb-2">
                      {item.children.map((child) => (
                        <a
                          key={child}
                          href={DEAD_LINK}
                          className={`block py-2 pl-4 text-[13px] text-[var(--vm-text-muted)] ${FOCUS_DARK}`}
                        >
                          {child}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
