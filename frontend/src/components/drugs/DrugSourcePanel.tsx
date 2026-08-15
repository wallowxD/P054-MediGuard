import { BookOpen } from "lucide-react";
import DrugLeafletViewer from "./DrugLeafletViewer";

interface DrugSourcePanelProps {
  /** Có khi đang ở trang chi tiết một thuốc cụ thể và leaflet đã sẵn sàng */
  leafletUrl?: string;
  /** Tên thuốc, chỉ để đặt tiêu đề cho khung xem tài liệu */
  drugName?: string;
}

/**
 * Ở màn tìm kiếm, panel giải thích quy tắc nguồn. Khi đã có một `leafletUrl` cụ thể,
 * chỉ hiển thị tài liệu gốc để tránh lặp lại thông tin ngay phía trên khung nhúng.
 */
export default function DrugSourcePanel({ leafletUrl, drugName }: DrugSourcePanelProps) {
  if (leafletUrl) {
    return <DrugLeafletViewer leafletUrl={leafletUrl} drugName={drugName} />;
  }

  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/[0.035] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">Nguồn thông tin được kiểm chứng</h2>
          <p className="max-w-4xl text-xs leading-5 text-foreground-secondary sm:text-sm sm:leading-6">
            Kết quả tra cứu, khi sẵn sàng, sẽ trích dẫn nguyên văn từ tờ hướng dẫn sử dụng
            (HDSD) do bệnh viện cung cấp, kèm đường dẫn tới tài liệu gốc. Nội dung không có trích
            dẫn sẽ được báo &quot;chưa có dữ liệu&quot; thay vì suy đoán.
          </p>
        </div>
      </div>
    </div>
  );
}
