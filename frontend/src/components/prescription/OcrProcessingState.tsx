import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/LoadingSpinner";

interface OcrProcessingStateProps {
  onBack: () => void;
}

/**
 * Trạng thái "đang nhận diện đơn thuốc" — thuần hiển thị, KHÔNG tự chạy timer và
 * KHÔNG fake kết quả OCR. Trang gọi component này chỉ khi có tiến trình OCR thật.
 */
export default function OcrProcessingState({ onBack }: OcrProcessingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center"
    >
      <LoadingSpinner size="lg" />
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">Đang nhận diện đơn thuốc</p>
        <p className="max-w-md text-sm text-foreground-secondary">
          Hệ thống sẽ trích xuất candidate tên thuốc từ ảnh để bạn xác nhận với danh mục bệnh
          viện.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại chọn ảnh
      </Button>
    </div>
  );
}
