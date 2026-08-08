import { DrugCatalogBrowser, DrugSourcePanel } from "@/components/drugs";

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

      <DrugCatalogBrowser />

      <DrugSourcePanel />
    </div>
  );
}
