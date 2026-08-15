"use client";

import { Clock3, Combine, History } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { ROUTES } from "@/constants/routes";
import { useInteractionChecks } from "@/queries/interactions";

interface SidebarHistoryProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const formatCheckedAt = (value: string): string =>
  new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

export default function SidebarHistory({ onNavigate, collapsed = false }: SidebarHistoryProps) {
  const { data, isLoading, isError } = useInteractionChecks();
  const titleId = useId();
  const recentItems = data?.slice(0, 3) ?? [];

  if (collapsed) {
    return (
      <div className="mt-6 flex justify-center">
        <Link
          href={ROUTES.HISTORY}
          onClick={onNavigate}
          title="Lịch sử tra cứu"
          className="flex h-10 w-10 items-center justify-center rounded-2xl liquid-glass-pill text-foreground-secondary hover:text-primary transition-all"
        >
          <History className="h-4.5 w-4.5" aria-hidden />
          <span className="sr-only">Lịch sử tra cứu</span>
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-6" aria-labelledby={titleId}>
      <div className="flex items-center justify-between px-2 mb-2">
        <h2
          id={titleId}
          className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted"
        >
          Lịch sử tra cứu
        </h2>
        <Link
          href={ROUTES.HISTORY}
          onClick={onNavigate}
          className="text-[11px] font-semibold text-primary transition-colors hover:opacity-80"
        >
          Xem tất cả
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-1.5">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-2xl bg-surface/60" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 p-3">
          <p className="text-[11px] text-foreground-secondary">
            Chưa thể tải lịch sử.
          </p>
        </div>
      ) : recentItems.length > 0 ? (
        <ul className="space-y-1.5">
          {recentItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`${ROUTES.INTERACTION_CHECKS}/${item.id}`}
                onClick={onNavigate}
                className="group flex items-center gap-2.5 rounded-2xl p-2.5 transition-all duration-200 hover:bg-surface/80"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Combine className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground group-hover:text-primary">
                    {item.drugNames.join(" + ") || "Lượt tra cứu"}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-foreground-muted">
                    <Clock3 className="h-3 w-3" />
                    {formatCheckedAt(item.checkedAt)} • {item.resultCount} kết quả
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-border/80 p-3">
          <History className="h-3.5 w-3.5 text-foreground-muted" />
          <p className="text-[11px] text-foreground-muted">Chưa có lượt tra cứu nào.</p>
        </div>
      )}
    </section>
  );
}
