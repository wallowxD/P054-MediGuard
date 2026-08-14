"use client";

import { Clock3, Combine, History } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { ROUTES } from "@/constants/routes";
import { useInteractionChecks } from "@/queries/interactions";

interface SidebarHistoryProps {
  /** Đóng drawer mobile sau khi người dùng chọn một lượt tra cứu. */
  onNavigate?: () => void;
}

const formatCheckedAt = (value: string): string =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

/** Ba lượt gần nhất, dùng cùng query/cache với trang `/history`. */
export default function SidebarHistory({ onNavigate }: SidebarHistoryProps) {
  const { data, isLoading, isError } = useInteractionChecks();
  const titleId = useId();
  const recentItems = data?.slice(0, 3) ?? [];

  return (
    <section className="mt-6" aria-labelledby={titleId}>
      <div className="flex items-center justify-between px-3">
        <h2
          id={titleId}
          className="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
        >
          Lịch sử tra cứu
        </h2>
        <Link
          href={ROUTES.HISTORY}
          onClick={onNavigate}
          className="rounded text-xs font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Xem tất cả
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-2 space-y-1.5" aria-label="Đang tải lịch sử tra cứu">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-2 rounded-lg border border-error/20 bg-error/5 px-3 py-3">
          <p className="text-xs leading-5 text-foreground-secondary">
            Chưa thể tải lịch sử. Bạn vẫn có thể mở trang xem tất cả.
          </p>
        </div>
      ) : recentItems.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {recentItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`${ROUTES.INTERACTION_CHECKS}/${item.id}`}
                onClick={onNavigate}
                className="group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-hero-tint text-primary">
                  <Combine className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-foreground">
                    {item.drugNames.join(" + ") || "Lượt tra cứu tương tác"}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-foreground-muted">
                    <Clock3 className="h-3 w-3" aria-hidden />
                    {formatCheckedAt(item.checkedAt)} · {item.resultCount} kết quả
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4">
          <History className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
          <p className="text-xs leading-5 text-foreground-muted">Chưa có lượt tra cứu nào.</p>
        </div>
      )}
    </section>
  );
}
