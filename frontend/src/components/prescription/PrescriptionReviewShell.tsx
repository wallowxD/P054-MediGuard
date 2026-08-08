"use client";

import { AlertTriangle, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";
import { DrugCatalogPicker, SelectedDrugList } from "@/components/drugs";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { removeDrug } from "@/store/reducers/drug-basket";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectBasketDrugs } from "@/store/selectors";
import OcrCandidateList from "./OcrCandidateList";

/**
 * Nội dung `/prescriptions/review` — ba vùng: candidate OCR chưa xác nhận, tìm
 * thuốc trong catalog, danh sách thuốc đã xác nhận. Không persist ảnh/candidate
 * vào browser storage.
 *
 * TODO(API): khi có OCR + catalog thật, nạp candidates từ kết quả OCR và cho
 * DrugCatalogPicker xác nhận từng candidate (dispatch `addDrug` với `IDrugItem`
 * thật từ catalog, không phải text OCR thô).
 */
export default function PrescriptionReviewShell() {
  const dispatch = useAppDispatch();
  const confirmedDrugs = useAppSelector(selectBasketDrugs);

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-xl font-semibold text-foreground">Xác nhận danh sách thuốc</h1>
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Tên nhận diện từ đơn thuốc chỉ là candidate. Bạn cần xác nhận thuốc từ danh mục bệnh
          viện trước khi tra cứu.
        </p>
      </header>

      <section
        aria-label="Candidate từ OCR"
        className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <h2 className="text-sm font-semibold text-foreground">Candidate nhận diện từ ảnh</h2>
        <OcrCandidateList candidates={[]} />
      </section>

      <section
        aria-label="Tìm thuốc trong danh mục"
        className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <DrugCatalogPicker label="Tìm thuốc trong danh mục bệnh viện" />
      </section>

      <section
        aria-label="Thuốc đã xác nhận"
        className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <SelectedDrugList
          label="Thuốc đã xác nhận"
          drugs={confirmedDrugs}
          onRemove={(id) => dispatch(removeDrug(id))}
          emptyHint="Chưa có thuốc nào được xác nhận."
        />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={ROUTES.INTERACTIONS_DRUG_DRUG}
            className="inline-flex items-center gap-1.5 text-foreground-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Quay lại tải ảnh đơn thuốc
          </Link>
          <Link
            href={ROUTES.DRUG_INFORMATION}
            className="inline-flex items-center gap-1.5 text-foreground-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-4 w-4" aria-hidden />
            Tìm thuốc thủ công
          </Link>
        </div>
        <Button variant="solid" size="sm" disabled={confirmedDrugs.length === 0}>
          Tiếp tục tra tương tác
        </Button>
      </div>
    </div>
  );
}
