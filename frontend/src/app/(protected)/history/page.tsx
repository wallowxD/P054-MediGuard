"use client";

import { History, Sparkles, Trash2 } from "lucide-react";
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
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl liquid-glass p-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <History className="h-3.5 w-3.5" />
            <span>Lịch sử tra cứu tài khoản</span>
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">Lịch sử tra cứu</h1>
          <p className="text-xs text-foreground-secondary">
            Các lượt tra cứu tương tác thuốc và bệnh nền đã thực hiện, sắp xếp theo thời gian mới nhất.
          </p>
        </div>
        {items.length ? (
          <Button
            variant="glass"
            size="sm"
            disabled={clear.isPending}
            onClick={() => {
              if (window.confirm("Bạn có chắc chắn muốn xoá toàn bộ lịch sử tra cứu không?")) {
                clear.mutate();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-error" />
            <span>{clear.isPending ? "Đang xoá…" : "Xoá tất cả"}</span>
          </Button>
        ) : null}
      </header>

      {isLoading ? (
        <div className="rounded-3xl liquid-glass p-6" aria-hidden="true">
          <TextSkeleton lines={5} />
        </div>
      ) : isError ? (
        <HistoryLoadError onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : items.length > 0 ? (
        <SearchHistoryList items={items} />
      ) : (
        <div className="rounded-3xl liquid-glass p-10 text-center">
          <EmptyState
            icon={<History className="h-10 w-10 text-foreground-muted" aria-hidden />}
            title="Chưa có lượt tra cứu nào"
            description="Mỗi khi bạn thực hiện tra cứu tương tác thuốc, kết quả sẽ được lưu trữ an toàn tại đây."
            action={
              <Button href={ROUTES.INTERACTIONS_DRUG_DRUG} variant="solid" size="sm">
                Bắt đầu tra cứu ngay
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
