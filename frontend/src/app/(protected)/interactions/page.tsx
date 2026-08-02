"use client";

import { Search } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useAppSelector } from "@/store/hooks";
import { selectBasketCount } from "@/store/selectors";

// TODO(API): ráp `useCheckInteractions()` + `useDrugSearch()` khi backend bật
// router /api/v1/interactions. Hook đã sẵn ở src/queries/interactions.ts.
export default function InteractionsPage() {
  const basketCount = useAppSelector(selectBasketCount);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-foreground">Tra tương tác</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Thêm ít nhất 2 thuốc để tra tương tác thuốc–thuốc, hoặc thêm thực phẩm để
          tra tương tác thuốc–thực phẩm.
        </p>
      </header>

      {basketCount === 0 ? (
        <EmptyState
          icon={<Search className="h-10 w-10" />}
          title="Chưa có thuốc nào được chọn"
          description="Ô tìm kiếm thuốc sẽ hoạt động khi backend mở endpoint /api/v1/drugs/search."
        />
      ) : null}
    </div>
  );
}
