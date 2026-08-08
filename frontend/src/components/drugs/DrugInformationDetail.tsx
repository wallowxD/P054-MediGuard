"use client";

import { BookOpen } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { CitationBlock } from "@/components/interactions";
import { useDrugDetails } from "@/queries/interactions";
import DrugInformationSkeleton from "./DrugInformationSkeleton";
import DrugSourcePanel from "./DrugSourcePanel";

interface DrugInformationDetailProps {
  id: string;
}

/**
 * Nội dung chính của `/drug-information/[id]`.
 *
 * TODO(API): `useDrugDetails` gọi GET /api/v1/drugs/{id}; hiện luôn reject vì
 * backend catalog detail chưa mở (xem `services/interactions/index.ts`). Khi có
 * dữ liệu thật, chỉ hiển thị khi `citations` không rỗng — không suy đoán thông
 * tin thuốc (luật số 1 của dự án).
 */
export default function DrugInformationDetail({ id }: DrugInformationDetailProps) {
  const { data, isLoading } = useDrugDetails(id);

  if (isLoading) return <DrugInformationSkeleton />;

  if (!data || !data.citations?.length) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<BookOpen className="h-10 w-10" aria-hidden />}
          title="Chưa thể tải thông tin thuốc"
          description="Dữ liệu sẽ hiển thị khi danh mục và leaflet được kết nối."
        />
        <DrugSourcePanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">{data.brandName}</h1>
        <p className="text-sm text-foreground-secondary">{data.ingredient}</p>
      </header>

      <div className="space-y-2">
        {data.citations.map((citation, i) => (
          <CitationBlock key={i} citation={citation} />
        ))}
      </div>

      <DrugSourcePanel leafletUrl={data.leafletUrl} />
    </div>
  );
}
