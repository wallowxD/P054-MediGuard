"use client";

import { History, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import SidebarNavList from "./SidebarNavList";
import SidebarUserFooter from "./SidebarUserFooter";

/** Topbar + drawer điều hướng cho mobile/tablet — chỉ hiển thị dưới `lg:` */
export default function MobileTopbar() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isFirstRender = useRef(true);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Di chuyển focus vào/ra khỏi drawer để không rơi vào nội dung ẩn phía sau.
  // Bỏ qua lần render đầu — tránh cướp focus vào nút hamburger ngay lúc tải trang.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (open) {
      closeButtonRef.current?.focus();
    } else {
      menuButtonRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background-elevated/80 px-4 backdrop-blur lg:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Mở menu điều hướng"
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          className="rounded-lg p-2 text-foreground-secondary hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Link
          href={ROUTES.DASHBOARD}
          className="flex items-center gap-2 font-heading text-base font-semibold text-foreground"
        >
          <Logo className="h-7 w-auto" />
        </Link>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      ) : null}

      <div
        id="mobile-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Điều hướng"
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-background-elevated shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <Logo className="h-7 w-auto" />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Đóng menu"
            className="rounded-lg p-2 text-foreground-secondary hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
          <SidebarNavList onNavigate={close} />

          <div className="mt-6">
            <div className="flex items-center justify-between px-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
                Lịch sử tra cứu
              </h2>
              <Link
                href={ROUTES.HISTORY}
                onClick={close}
                className="rounded text-xs font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Xem tất cả
              </Link>
            </div>
            <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-center">
              <History className="h-5 w-5 text-foreground-muted" aria-hidden />
              <p className="text-xs text-foreground-muted">Chưa có lượt tra cứu nào.</p>
            </div>
          </div>
        </div>

        <SidebarUserFooter onNavigate={close} />
      </div>
    </>
  );
}
