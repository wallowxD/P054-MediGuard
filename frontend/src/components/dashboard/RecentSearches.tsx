"use client";

import { ArrowRight, History } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { HistoryLoadError, SearchHistoryList } from "@/components/history";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { useInteractionChecks } from "@/queries/interactions";

const RECENT_LIMIT = 5;

export default function RecentSearches() {
  const { data, isLoading, isError, isFetching, refetch } = useInteractionChecks();

  const recentItems = [...(data ?? [])]
    .sort((first, second) => Date.parse(second.checkedAt) - Date.parse(first.checkedAt))
    .slice(0, RECENT_LIMIT);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-heading text-lg font-bold text-foreground">Tra cứu gần đây</h2>
        <Link
          href={ROUTES.HISTORY}
          className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:opacity-80"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Đang tải lịch sử tra cứu" aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <HistoryLoadError onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : recentItems.length > 0 ? (
        <SearchHistoryList items={recentItems} />
      ) : (
        <div className="rounded-3xl liquid-glass p-8 text-center">
          <EmptyState
            icon={<History className="h-10 w-10 text-foreground-muted" aria-hidden />}
            title="Chưa có lượt tra cứu nào"
            description="Kết quả các lượt tra cứu tương tác gần nhất sẽ hiển thị ở đây."
            action={
              <Button href={ROUTES.INTERACTIONS_DRUG_DRUG} variant="solid" size="sm">
                Bắt đầu tra cứu ngay
              </Button>
            }
          />
        </div>
      )}
    </section>
  );
}
