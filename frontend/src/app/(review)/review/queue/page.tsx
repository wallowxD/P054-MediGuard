import { Inbox } from "lucide-react";
import EmptyState from "@/components/EmptyState";

// TODO(API): ráp GET /api/v1/reviews/queue + mutation approve/reject.
export default function ReviewQueuePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Hàng đợi duyệt</h1>
      <EmptyState
        icon={<Inbox className="h-10 w-10" />}
        title="Chưa có cảnh báo nào chờ duyệt"
        description="Danh sách sẽ hiển thị khi backend mở endpoint /api/v1/reviews/queue."
      />
    </div>
  );
}
