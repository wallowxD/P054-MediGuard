import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

interface HistoryLoadErrorProps {
  /** Gọi lại query lịch sử — truyền thẳng `refetch` của React Query hook. */
  onRetry: () => void;
  /** Đang gọi lại: khoá nút để người dùng không bấm chồng nhiều lần. */
  isRetrying?: boolean;
}

/**
 * Trạng thái lỗi khi không tải được lịch sử tra cứu.
 *
 * Tách riêng khỏi `EmptyState` vì hai tình huống này nói hai điều khác hẳn nhau: "chưa có
 * lượt tra cứu nào" là sự thật về tài khoản, còn đây là hệ thống chưa đọc được dữ liệu.
 * Hiển thị nhầm cái đầu khi request lỗi sẽ khiến người dùng tin là lịch sử đã mất.
 */
export default function HistoryLoadError({ onRetry, isRetrying = false }: HistoryLoadErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Không tải được lịch sử tra cứu</p>
          <p className="text-sm text-foreground-secondary">
            Kết nối tới máy chủ đang gián đoạn. Dữ liệu của bạn vẫn được giữ nguyên.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Đang thử lại…" : "Thử lại"}
      </Button>
    </div>
  );
}
