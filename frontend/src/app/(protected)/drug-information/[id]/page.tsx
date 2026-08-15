import { ChevronLeft, Pill } from "lucide-react";
import Link from "next/link";
import DrugInformationDetail from "@/components/drugs/DrugInformationDetail";
import { ROUTES } from "@/constants/routes";

// Trang chỉ truyền `id` xuống DrugInformationDetail; dữ liệu do useDrugDetails() lấy từ
// GET /api/v1/drugs/{id} phía client.
export default async function DrugInformationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <Link
        href={ROUTES.DRUG_INFORMATION}
        aria-label="Quay lại danh mục thuốc"
        className="group inline-flex min-h-14 items-center gap-3 rounded-2xl py-1 pr-4 text-left transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-background-elevated/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
      >
        <ChevronLeft
          className="h-5 w-5 shrink-0 text-foreground-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-0.5 group-hover:text-primary"
          strokeWidth={1.8}
          aria-hidden
        />
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
          <Pill className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">Danh mục thuốc</span>
          <span className="mt-0.5 block text-xs text-foreground-muted">Quay lại tra cứu</span>
        </span>
      </Link>

      <DrugInformationDetail id={id} />
    </div>
  );
}
