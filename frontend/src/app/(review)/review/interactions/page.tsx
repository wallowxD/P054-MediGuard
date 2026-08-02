import { Database } from "lucide-react";
import EmptyState from "@/components/EmptyState";

// TODO(API): quản lý toàn bộ bản ghi tương tác đã trích xuất (không chỉ hàng đợi).
export default function ReviewInteractionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Kho cảnh báo</h1>
      <EmptyState
        icon={<Database className="h-10 w-10" />}
        title="Chưa có dữ liệu"
        description="Danh sách bản ghi tương tác đã trích xuất từ PDF HDSD sẽ hiển thị ở đây."
      />
    </div>
  );
}
