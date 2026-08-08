import { FileWarning, SearchX } from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface InteractionResultsPlaceholderProps {
  title: string;
  description: string;
}

/**
 * Vùng "Kết quả tra cứu" dùng chung cho các màn tương tác chưa nối API.
 * Luôn kèm ghi chú về yêu cầu trích dẫn (ADR 0006) — không có citation thì không
 * có cảnh báo, kể cả sau khi backend đã trả dữ liệu thật.
 */
export default function InteractionResultsPlaceholder({
  title,
  description,
}: InteractionResultsPlaceholderProps) {
  return (
    <div className="space-y-3">
      <EmptyState
        icon={<SearchX className="h-10 w-10" aria-hidden />}
        title={title}
        description={description}
      />
      <p className="flex items-start gap-2 rounded-lg border border-border bg-background-elevated px-3 py-2 text-xs text-foreground-muted">
        <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Mọi cảnh báo tương tác hiển thị đều phải có trích dẫn nguyên văn kèm nguồn từ tờ hướng
        dẫn sử dụng. Không có trích dẫn hợp lệ, hệ thống báo &quot;chưa có dữ liệu&quot; thay vì
        suy đoán.
      </p>
    </div>
  );
}
