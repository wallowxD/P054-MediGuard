import { Pill } from "lucide-react";
import { DrugCatalogBrowser, DrugSourcePanel } from "@/components/drugs";

export default function DrugInformationPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <header className="flex items-start gap-4">
        <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(0,102,204,0.2)]">
          <Pill className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tra cứu thông tin thuốc
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Tìm biệt dược hoặc hoạt chất trong danh mục bệnh viện và xem thông tin từ tờ hướng dẫn sử dụng gốc.
          </p>
        </div>
      </header>

      <DrugCatalogBrowser />

      <DrugSourcePanel />
    </div>
  );
}
