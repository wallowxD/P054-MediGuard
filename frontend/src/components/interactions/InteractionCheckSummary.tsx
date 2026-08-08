import { CheckCircle2, FileWarning } from "lucide-react";

interface InteractionCheckSummaryProps {
  resultCount: number;
  unavailableCount: number;
}

/**
 * Thanh tóm tắt một lượt tra cứu — dùng ở vùng kết quả tra cứu trực tiếp và ở
 * `/interaction-checks/[id]`. Chỉ đếm số lượng; không tự kết luận "an toàn" khi
 * `unavailableCount` > 0 (ADR 0006).
 */
export default function InteractionCheckSummary({
  resultCount,
  unavailableCount,
}: InteractionCheckSummaryProps) {
  return (
    <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm">
      <span className="inline-flex items-center gap-1.5 text-foreground-secondary">
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
        {resultCount} kết quả có trích dẫn nguồn
      </span>
      <span className="inline-flex items-center gap-1.5 text-foreground-secondary">
        <FileWarning className="h-4 w-4 text-foreground-muted" aria-hidden />
        {unavailableCount} cặp chưa có dữ liệu
      </span>
    </div>
  );
}
