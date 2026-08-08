"use client";

import { Combine } from "lucide-react";
import { DrugCatalogPicker, SelectedDrugList } from "@/components/drugs";
import { InteractionResultsPlaceholder } from "@/components/interactions";
import { PrescriptionImageUpload } from "@/components/prescription";
import Button from "@/components/ui/Button";
import { removeDrug } from "@/store/reducers/drug-basket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectBasketDrugs } from "@/store/selectors";

const MIN_DRUGS_TO_CHECK = 2;

// TODO(API): ráp useCheckInteractions() (src/queries/interactions.ts) khi backend mở
// POST /api/v1/interactions/check cho kind "drug-drug" và exact-pair repository (ADR
// 0012). DrugCatalogPicker chưa có cách xác nhận thuốc thật (catalog search chưa mở),
// nên "Thuốc đã chọn" luôn rỗng và nút tra cứu luôn disabled — đúng trạng thái hiện tại.
export default function DrugDrugInteractionsPage() {
  const dispatch = useAppDispatch();
  const drugs = useAppSelector(selectBasketDrugs);
  const canCheck = drugs.length >= MIN_DRUGS_TO_CHECK;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thuốc – thuốc</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ.
        </p>
      </header>

      <PrescriptionImageUpload />

      <div className="space-y-5 rounded-xl border border-border bg-card p-4 sm:p-5">
        <DrugCatalogPicker label="Chọn thuốc từ danh mục bệnh viện" />

        <SelectedDrugList
          label="Thuốc đã chọn"
          drugs={drugs}
          onRemove={(id) => dispatch(removeDrug(id))}
          emptyHint="Chưa có thuốc nào được xác nhận từ danh mục bệnh viện."
        />

        <div className="space-y-1.5">
          <Button variant="solid" size="sm" disabled={!canCheck}>
            <Combine className="h-4 w-4" aria-hidden />
            Tra cứu tương tác
          </Button>
          {!canCheck ? (
            <p className="text-xs text-foreground-muted">
              Cần tối thiểu {MIN_DRUGS_TO_CHECK} thuốc đã xác nhận từ danh mục bệnh viện để tra
              cứu.
            </p>
          ) : null}
        </div>
      </div>

      <section aria-label="Kết quả tra cứu" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Kết quả</h2>
        <InteractionResultsPlaceholder
          title="Chưa đủ dữ liệu để tra cứu"
          description="Chọn tối thiểu hai thuốc đã xác nhận để tra cứu."
        />
      </section>
    </div>
  );
}
