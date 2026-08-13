"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROUTES, VINMEC_REFERRER_PARAM, VINMEC_REFERRER_VALUE } from "@/constants/routes";

/**
 * Thanh mảnh gắn trên đỉnh landing page MediGuard, CHỈ hiện khi khách vừa bấm từ
 * nav của cổng Vinmec sang (`/?from=vinmec`).
 *
 * ★ Vì sao cần tồn tại: yêu cầu demo là "đang ở trang MediGuard thì mục MediGuard
 *   phải ở trạng thái active, và logo Vinmec / nút quay lại phải đưa về cổng
 *   Vinmec". Header của Vinmec không được render trên trang MediGuard, nên thanh
 *   này là chỗ duy nhất mang được hai thứ đó.
 *
 * ★ Vì sao gắn theo query param chứ không hiện mặc định: khách vào thẳng "/" phải
 *   thấy landing page MediGuard y như cũ. Không có param thì component không được
 *   render, giao diện hiện tại không đổi một pixel nào.
 *
 * ★ Vì sao đọc query param ở CLIENT chứ không nhận từ `searchParams` của page:
 *   chạm vào `searchParams` sẽ kéo cả landing page "/" sang render động, mất khả
 *   năng prerender tĩnh của trang marketing chính. Đọc ở client (bọc `<Suspense>`)
 *   giữ nguyên "/" là trang tĩnh; thanh demo chỉ xuất hiện sau khi hydrate.
 *
 * Dùng màu Vinmec trực tiếp (`--vm-*` từ `.vinmec-theme`) nên phải tự bọc class đó.
 */
export default function VinmecReturnBar() {
  const searchParams = useSearchParams();

  if (searchParams.get(VINMEC_REFERRER_PARAM) !== VINMEC_REFERRER_VALUE) return null;

  return (
    <div className="vinmec-theme vinmec-topbar">
      <div className="vinmec-container flex flex-wrap items-center justify-between gap-3 py-2">
        <Link
          href={ROUTES.VINMEC}
          className="flex items-center gap-2 rounded-sm text-[13px] font-medium text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="rounded bg-white px-2 py-1">
            <Image
              src="/images/vinmec/logo.svg"
              alt="Vinmec Healthcare System"
              width={128}
              height={80}
              className="h-5 w-auto"
            />
          </span>
          <span>Quay lại Vinmec</span>
        </Link>

        <span className="flex items-center gap-2 text-[13px] text-white/85">
          <span className="hidden sm:inline">Bạn đang xem:</span>
          <span
            aria-current="page"
            className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-[var(--vm-menu-blue)]"
          >
            MediGuard
          </span>
        </span>
      </div>
    </div>
  );
}
