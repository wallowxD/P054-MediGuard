import { BookOpen } from "lucide-react";
import { DrugCatalogPicker, DrugSourcePanel } from "@/components/drugs";
import EmptyState from "@/components/EmptyState";

// TODO(API): ráp useDrugSearch() (src/queries/interactions.ts) khi backend mở
// GET /api/v1/drugs/search — DrugCatalogPicker hiện chỉ mô phỏng debounce/loading UI,
// không gọi fetch, không hiển thị kết quả suy đoán.
export default function DrugInformationPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thông tin thuốc</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin có dẫn nguồn từ tờ hướng dẫn sử dụng — nội dung tham khảo, không thay thế
          chỉ định của bác sĩ.
        </p>
      </header>

      <DrugCatalogPicker
        label="Tìm thuốc trong danh mục bệnh viện"
        placeholder="Nhập tên biệt dược hoặc hoạt chất…"
      />

      <EmptyState
        icon={<BookOpen className="h-10 w-10" aria-hidden />}
        title="Chưa có thông tin để hiển thị"
        description="Chọn một thuốc từ danh mục bệnh viện để xem thông tin có dẫn nguồn. Nội dung không có trích dẫn nguyên văn từ tờ hướng dẫn sử dụng sẽ không được hiển thị."
      />

      <DrugSourcePanel />
    </div>
  );
}
