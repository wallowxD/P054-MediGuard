import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InteractionCheckDetail } from "@/components/interactions";
import { ROUTES } from "@/constants/routes";

/**
 * Kết quả tổng hợp của MỘT LƯỢT tra cứu (có thể nhiều cặp) — khác với
 * `/interactions/[id]`, vốn là chi tiết một cặp tương tác đơn lẻ.
 *
 * TODO(API): trang chỉ truyền `id` xuống InteractionCheckDetail — ráp GET
 * /api/v1/interaction-checks/{id} tại useInteractionCheckDetail().
 */
export default async function InteractionCheckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href={ROUTES.HISTORY}
        className="inline-flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại lịch sử tra cứu
      </Link>

      <InteractionCheckDetail id={id} />
    </div>
  );
}
