"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import SidebarHistory from "./SidebarHistory";
import SidebarNavList from "./SidebarNavList";
import SidebarUserFooter from "./SidebarUserFooter";

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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border/60 liquid-glass-bar px-4 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Mở menu điều hướng"
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            className="flex h-9 w-9 items-center justify-center rounded-full liquid-glass-pill text-foreground hover:bg-surface"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <Link
            href={ROUTES.HOME}
            aria-label="Vinmec — về trang chủ"
            title="Trang chủ Vinmec"
            className="flex items-center transition-opacity hover:opacity-85"
          >
            <Logo className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden"
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
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col liquid-glass-strong shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          <Link
            href={ROUTES.HOME}
            onClick={close}
            aria-label="Vinmec — về trang chủ"
            title="Trang chủ Vinmec"
            className="flex items-center transition-opacity hover:opacity-85"
          >
            <Logo className="h-8 w-auto" />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Đóng menu"
            className="flex h-8 w-8 items-center justify-center rounded-full liquid-glass-pill text-foreground hover:bg-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
          <SidebarNavList onNavigate={close} />
          <SidebarHistory onNavigate={close} />
        </div>

        <SidebarUserFooter onNavigate={close} />
      </div>
    </>
  );
}
