"use client";

import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TextSkeleton } from "@/components/ui/Skeleton";
import { useInteractionCheckDetail } from "@/queries/interactions";
import InteractionCard from "./InteractionCard";
import InteractionCheckSummary from "./InteractionCheckSummary";
import UnavailableInteractionList from "./UnavailableInteractionList";

interface InteractionCheckDetailProps {
  id: string;
}

/**
 * Nội dung chính của `/interaction-checks/[id]` — kết quả tổng hợp của một lượt
 * tra cứu, có thể gồm nhiều cặp (khác `/interactions/[id]`, chi tiết một cặp).
 *
 * TODO(API): `useInteractionCheckDetail` gọi GET /api/v1/interaction-checks/{id};
 * hiện luôn reject vì backend chưa lưu lịch sử tra cứu (xem `services/interactions`).
 */
export default function InteractionCheckDetail({ id }: InteractionCheckDetailProps) {
  const { data, isLoading } = useInteractionCheckDetail(id);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5" aria-hidden="true">
        <TextSkeleton lines={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<AlertTriangle className="h-10 w-10" aria-hidden />}
        title="Chưa thể tải lượt tra cứu này"
        description="Dữ liệu lịch sử sẽ khả dụng khi backend được kết nối."
      />
    );
  }

  return (
    <div className="space-y-6">
      <InteractionCheckSummary
        resultCount={data.items.length}
        unavailableCount={data.unavailable.length}
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Thuốc đã xác nhận</h2>
        <p className="text-sm text-foreground-secondary">
          {data.drugs.map((d) => d.brandName).join(", ") || "—"}
        </p>
      </section>

      {data.foods.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Thực phẩm</h2>
          <p className="text-sm text-foreground-secondary">{data.foods.join(", ")}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Kết quả có trích dẫn</h2>
        {data.items.map((item) => (
          <InteractionCard key={item.id} interaction={item} />
        ))}
      </section>

      <UnavailableInteractionList items={data.unavailable} />
    </div>
  );
}
