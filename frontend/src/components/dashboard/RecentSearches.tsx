import { History } from "lucide-react";
import EmptyState from "@/components/EmptyState";

// TODO(API): thay EmptyState bằng danh sách thật khi có GET lịch sử tra cứu.
export default function RecentSearches() {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-foreground">Tra cứu gần đây</h2>
      <EmptyState
        icon={<History className="h-10 w-10" aria-hidden />}
        title="Chưa có lượt tra cứu nào"
        description="Kết quả các lượt tra cứu gần nhất sẽ hiển thị ở đây."
      />
    </section>
  );
}
