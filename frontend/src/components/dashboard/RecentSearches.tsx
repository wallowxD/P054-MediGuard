"use client";

import { History } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { HistoryLoadError, SearchHistoryList } from "@/components/history";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";
import { useInteractionChecks } from "@/queries/interactions";

/** Dashboard chỉ tóm tắt; danh sách đầy đủ nằm ở `/history`. */
const RECENT_LIMIT = 5;

/**
 * Năm lượt tra cứu gần nhất của chính tài khoản đang đăng nhập.
 *
 * Dùng lại query `useInteractionChecks()` của `/history` và `SidebarHistory` nên ba nơi
 * chia sẻ một cache; backend đã lọc theo `user_id` và sắp xếp giảm dần theo thời gian.
 */
export default function RecentSearches() {
  const { data, isLoading, isError, isFetching, refetch } = useInteractionChecks();

  // Sắp xếp lại phía client là lớp chặn rẻ tiền: dashboard chỉ lấy 5 dòng đầu nên một thay
  // đổi thứ tự ở backend sẽ âm thầm hiện nhầm lượt cũ nếu chỉ tin vào thứ tự trả về.
  const recentItems = [...(data ?? [])]
    .sort((first, second) => Date.parse(second.checkedAt) - Date.parse(first.checkedAt))
    .slice(0, RECENT_LIMIT);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">Tra cứu gần đây</h2>
        <Link
          href={ROUTES.HISTORY}
          className="rounded text-sm font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Xem tất cả
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="Đang tải lịch sử tra cứu" aria-busy="true">
          {Array.from({ length: RECENT_LIMIT }).map((_, index) => (
            <Skeleton key={index} className="h-[86px] w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <HistoryLoadError onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : recentItems.length > 0 ? (
        <SearchHistoryList items={recentItems} />
      ) : (
        <EmptyState
          icon={<History className="h-10 w-10" aria-hidden />}
          title="Chưa có lượt tra cứu nào"
          description="Kết quả các lượt tra cứu gần nhất sẽ hiển thị ở đây."
          action={
            <Button href={ROUTES.INTERACTIONS_DRUG_DRUG} variant="solid" size="sm">
              Bắt đầu tra cứu
            </Button>
          }
        />
      )}
    </section>
  );
}
