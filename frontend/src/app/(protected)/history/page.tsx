"use client";

import { History } from "lucide-react";
import { HistoryLoadError, SearchHistoryList } from "@/components/history";
import EmptyState from "@/components/EmptyState";
import { TextSkeleton } from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useClearInteractionChecks, useInteractionChecks } from "@/queries/interactions";

export default function HistoryPage() {
  const { data, isLoading, isError, isFetching, refetch } = useInteractionChecks();
  const clear = useClearInteractionChecks();
  const items = data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1"><h1 className="text-xl font-semibold text-foreground">Lịch sử tra cứu</h1>
        <p className="text-sm text-foreground-secondary">
          Các lượt tra cứu đã lưu của tài khoản này, mới nhất trước.
        </p></div>
        {items.length ? <Button variant="outline" size="sm" disabled={clear.isPending} onClick={() => { if (window.confirm("Xoá toàn bộ lịch sử tra cứu của bạn?")) clear.mutate(); }}>Xoá tất cả</Button> : null}
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-hidden="true">
          <TextSkeleton lines={4} />
        </div>
      ) : isError ? (
        <HistoryLoadError onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : items.length > 0 ? (
        <SearchHistoryList items={items} />
      ) : (
        <EmptyState
          icon={<History className="h-10 w-10" aria-hidden />}
          title="Chưa có lượt tra cứu nào"
          description="Mỗi lượt tra cứu tương tác sẽ được lưu lại tại đây."
          action={
            <Button href={ROUTES.INTERACTIONS_DRUG_DRUG} variant="solid" size="sm">
              Bắt đầu tra cứu
            </Button>
          }
        />
      )}
    </div>
  );
}
