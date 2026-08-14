"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useId, useRef } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Những gì có thể nhận focus bên trong dialog — dùng để bẫy Tab */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Primitive dùng chung cho 4 modal auth — viết lại markup overlay 4 lần là thừa.
 *
 * Dialog phải giữ được người dùng bàn phím: focus đi vào khi mở, quẩn vòng bên
 * trong khi Tab, trả về đúng phần tử đã mở khi đóng, và Escape luôn đóng được.
 * Thiếu một trong bốn thứ đó thì người dùng bàn phím bị lạc ra sau lớp overlay
 * mà không có cách nào quay lại.
 */
export default function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // Phần tử đã mở modal — trả focus về đây khi đóng.
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const getFocusable = useCallback(
    () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []),
    []
  );

  // Đưa focus vào dialog khi mở và trả về trigger khi đóng.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Ưu tiên control đầu tiên trong nội dung; không có thì rơi về nút đóng.
    const [firstFocusable] = getFocusable();
    (firstFocusable ?? closeButtonRef.current)?.focus();

    return () => {
      triggerRef.current?.focus();
    };
  }, [open, getFocusable]);

  // Khoá cuộn nền: không thì trang phía sau vẫn trôi khi lăn chuột trên overlay.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Quẩn vòng ở hai đầu; nếu focus đã rơi ra ngoài dialog thì kéo về đầu danh sách.
      if (!dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, getFocusable]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-medium text-foreground">
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="-mr-1.5 -mt-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
