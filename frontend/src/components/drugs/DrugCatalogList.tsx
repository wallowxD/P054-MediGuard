"use client";

import { FileText, Pill } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";

interface DrugCatalogListProps {
  items: IDrugCatalogRow[];
  isLoading: boolean;
  /** Đang tải trang mới trong khi vẫn hiển thị trang cũ */
  isFetching?: boolean;
  emptyTitle?: string;
  emptyDescription: string;
}

function LeafletTag({ hasLeaflet }: { hasLeaflet?: boolean }) {
  // `undefined` = kết quả tới từ /drugs/search, endpoint đó không trả trường này. Im lặng
  // còn hơn khẳng định "chưa có tờ HDSD" cho một thuốc thực ra có nguồn.
  if (hasLeaflet === undefined) return null;

  if (!hasLeaflet) return <span>Chưa có tờ HDSD</span>;

  return (
    <span className="inline-flex items-center gap-1">
      <FileText className="h-3.5 w-3.5" aria-hidden />
      Có tờ HDSD
    </span>
  );
}

function DrugRow({ drug }: { drug: IDrugCatalogRow }) {
  // Ghép dạng bào chế và đường dùng thành một dòng phụ; danh mục thật có nhiều dòng
  // thiếu cả hai trường nên phải lọc trước khi nối, tránh hiện dấu "·" lơ lửng.
  const details = [drug.dosageForm, drug.route].filter(Boolean).join(" · ");
  const hasMeta = Boolean(details) || drug.hasLeaflet !== undefined;

  return (
    <li className="border-b border-border last:border-b-0">
      {/* Link bọc cả dòng chứ không chỉ tên thuốc: vùng chạm rộng hơn trên mobile, và
          screen reader đọc được cả hoạt chất lẫn dạng bào chế trong cùng một link. */}
      <Link
        href={`${ROUTES.DRUG_INFORMATION}/${drug.id}`}
        className="group block rounded-lg py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
          {drug.brandName}
        </p>
        {/* whitespace-pre-line: ingredient_raw giữ nguyên văn từ nguồn nên có xuống dòng thật */}
        <p className="mt-0.5 whitespace-pre-line text-sm text-foreground-secondary">
          {drug.ingredient}
        </p>
        {hasMeta ? (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-muted">
            {details ? <span>{details}</span> : null}
            <LeafletTag hasLeaflet={drug.hasLeaflet} />
          </div>
        ) : null}
      </Link>
    </li>
  );
}

/**
 * Danh sách thuốc hai cột, đúng bố cục danh mục của bệnh viện tham chiếu.
 *
 * Mỗi dòng là link tới `/drug-information/{id}`, nơi `GET /api/v1/drugs/{id}` trả nội dung
 * trích nguyên văn từ tờ HDSD.
 *
 * Bản thân dòng chỉ hiển thị dữ liệu định danh, không có nội dung lâm sàng: danh sách không
 * kèm trích dẫn nên theo luật số 1 nó không được phép nói bất cứ điều gì về công dụng hay
 * cảnh báo của thuốc.
 */
export default function DrugCatalogList({
  items,
  isLoading,
  isFetching = false,
  emptyTitle = "Không có thuốc nào khớp",
  emptyDescription,
}: DrugCatalogListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-x-8 sm:grid-cols-2" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-border py-3">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="mt-2 h-3.5 w-2/5" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Pill className="h-10 w-10" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul
      className={`grid gap-x-8 transition-opacity sm:grid-cols-2 ${isFetching ? "opacity-60" : ""}`}
    >
      {items.map((drug) => (
        <DrugRow key={drug.id} drug={drug} />
      ))}
    </ul>
  );
}
