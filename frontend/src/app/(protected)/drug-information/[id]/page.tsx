import { ArrowLeft } from "lucide-react";
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
    <div className="space-y-6">
      <Link
        href={ROUTES.DRUG_INFORMATION}
        className="inline-flex items-center gap-1.5 text-sm text-foreground-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Quay lại tìm thuốc
      </Link>

      <DrugInformationDetail id={id} />
    </div>
  );
}
