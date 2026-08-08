import { BookOpen, ExternalLink } from "lucide-react";

interface DrugSourcePanelProps {
  /** Có khi đang ở trang chi tiết một thuốc cụ thể và leaflet đã sẵn sàng */
  leafletUrl?: string;
  sourceLabel?: string;
}

/**
 * Panel giải thích nguồn thông tin thuốc — dùng ở cả màn tìm kiếm (`leafletUrl`
 * chưa có, chỉ giải thích quy tắc) và màn chi tiết (`leafletUrl` có, kèm link tài
 * liệu gốc). Nội dung không có trích dẫn nguyên văn sẽ không được hiển thị.
 */
export default function DrugSourcePanel({ leafletUrl, sourceLabel }: DrugSourcePanelProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hero-tint text-primary">
          <BookOpen className="h-4 w-4" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Nguồn thông tin</h2>
          <p className="text-sm leading-relaxed text-foreground-secondary">
            {leafletUrl
              ? "Nội dung trên trích dẫn nguyên văn từ tờ hướng dẫn sử dụng (HDSD) do bệnh viện cung cấp."
              : "Kết quả tra cứu, khi sẵn sàng, sẽ trích dẫn nguyên văn từ tờ hướng dẫn sử dụng (HDSD) do bệnh viện cung cấp, kèm đường dẫn tới tài liệu gốc. Nội dung không có trích dẫn sẽ được báo \"chưa có dữ liệu\" thay vì suy đoán."}
          </p>
          {leafletUrl ? (
            <a
              href={leafletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {sourceLabel ?? "Xem tài liệu gốc"}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
