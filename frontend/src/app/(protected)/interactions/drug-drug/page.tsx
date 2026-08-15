"use client";

import { AlertTriangle, Combine, Database, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { DrugCatalogPicker, SelectedDrugList } from "@/components/drugs";
import { DiseaseAutocomplete, HealthProfilePanel, UnifiedInteractionResults } from "@/components/interactions";
import { CONDITIONS } from "@/components/interactions/HealthProfilePanel";
import { PrescriptionImageUpload } from "@/components/prescription";
import Button from "@/components/ui/Button";
import { TextSkeleton } from "@/components/ui/Skeleton";
import { useCheckInteractions, useDiseaseSearch } from "@/queries/interactions";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addDrug, removeDrug } from "@/store/reducers/drug-basket";
import { selectBasketDrugs } from "@/store/selectors";

export default function DrugDrugInteractionsPage() {
  const dispatch = useAppDispatch();
  const drugs = useAppSelector(selectBasketDrugs);
  const [diseases, setDiseases] = useState<IDiseaseItem[]>([]);
  const [appliedConditions, setAppliedConditions] = useState<TConditionCode[]>([]);
  const check = useCheckInteractions();
  const pregnancy = useDiseaseSearch("Mang thai");
  const breastfeeding = useDiseaseSearch("Phụ nữ cho con bú");
  const specialQueries = useMemo(
    () => ({
      "mang-thai": pregnancy.data?.items,
      "cho-con-bu": breastfeeding.data?.items,
    }),
    [pregnancy.data, breastfeeding.data]
  );

  const confirmedSpecialDiseases = appliedConditions.flatMap((code) => {
    if (code !== "mang-thai" && code !== "cho-con-bu") return [];
    const expected = CONDITIONS.find((value) => value.code === code)?.diseaseName;
    const exact = specialQueries[code]?.find((value) => value.name === expected);
    return exact ? [exact] : [];
  });

  const allDiseases = [...diseases, ...confirmedSpecialDiseases].filter(
    (value, index, values) => values.findIndex((candidate) => candidate.id === value.id) === index
  );
  const canCheck = drugs.length >= 2 || (drugs.length >= 1 && allDiseases.length >= 1);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <header className="space-y-1.5">
        <div className="inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Trợ lý An toàn Thuốc AI</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          Tra cứu tương tác tổng hợp
        </h1>
        <p className="max-w-2xl text-xs sm:text-sm text-foreground-secondary">
          Đối chiếu thuốc–thuốc, thuốc–bệnh nền và thuốc–thực phẩm có trích dẫn nguyên văn từ tờ HDSD.
        </p>
      </header>

      {/* Health Profile Panel */}
      <HealthProfilePanel applied={appliedConditions} onAppliedChange={setAppliedConditions} />

      {/* Main Checking Workspace */}
      <section className="rounded-3xl liquid-glass p-5 sm:p-7 shadow-lg">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <DrugCatalogPicker
              label="Chọn thuốc tra cứu"
              onSelect={(drug) => dispatch(addDrug(drug))}
              selectedIds={drugs.map((drug) => drug.id)}
            />
            <SelectedDrugList
              label="Thuốc đã chọn"
              drugs={drugs}
              onRemove={(id) => dispatch(removeDrug(id))}
              emptyHint="Chưa có thuốc nào trong giỏ tra cứu."
            />
            <DiseaseAutocomplete selected={diseases} onChange={setDiseases} />
          </div>

          <PrescriptionImageUpload
            selectedDrugIds={drugs.map((drug) => drug.id)}
            selectedDiseaseIds={allDiseases.map((disease) => disease.id)}
            onApplyDrugs={(recognizedDrugs) => {
              recognizedDrugs.forEach((drug) => dispatch(addDrug(drug)));
            }}
            onApplyDiseases={(recognizedDiseases) => {
              setDiseases((current) =>
                [...current, ...recognizedDiseases].filter(
                  (disease, index, values) =>
                    values.findIndex((candidate) => candidate.id === disease.id) === index
                )
              );
            }}
          />
        </div>

        {/* Action Bar */}
        <div className="mt-8 border-t border-border/60 pt-6">
          <Button
            variant="solid"
            size="lg"
            disabled={!canCheck || check.isPending}
            onClick={() =>
              check.mutate({
                drugIds: drugs.map((drug) => drug.id),
                diseaseIds: allDiseases.map((disease) => disease.id),
              })
            }
          >
            {check.isPending ? (
              <Search className="h-4 w-4 animate-pulse" aria-hidden />
            ) : (
              <Combine className="h-4 w-4" aria-hidden />
            )}
            <span>{check.isPending ? "AI đang đối chiếu cơ sở dữ liệu…" : "Bắt đầu đối chiếu tương tác"}</span>
          </Button>

          {!canCheck ? (
            <p className="mt-2.5 text-xs text-foreground-muted">
              Cần ít nhất 2 thuốc, hoặc 1 thuốc kèm 1 bệnh nền được xác nhận để bắt đầu tra cứu.
            </p>
          ) : null}
          {appliedConditions.length > confirmedSpecialDiseases.length ? (
            <p className="mt-2 text-xs text-amber-500">
              Một tình trạng đặc biệt chưa resolve được đúng tên trong danh mục bệnh; chưa được gửi tra cứu.
            </p>
          ) : null}
        </div>
      </section>

      {/* Pending State */}
      {check.isPending ? (
        <div className="rounded-3xl liquid-glass-strong p-6 sm:p-8" role="status" aria-live="polite">
          <div className="flex items-start gap-4">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Database className="h-6 w-6" aria-hidden />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-primary" />
            </span>
            <div>
              <p className="font-heading text-base font-bold text-foreground">AI đang tìm kiếm trong cơ sở dữ liệu</p>
              <p className="mt-1 max-w-2xl text-xs text-foreground-secondary">
                Hệ thống đang đối chiếu chính xác từng cặp thuốc và bệnh nền, sau đó kiểm tra trích dẫn trước khi hiển thị kết quả.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <TextSkeleton lines={4} />
          </div>
        </div>
      ) : null}

      {/* Error State */}
      {check.isError ? (
        <div role="alert" className="flex gap-3 rounded-3xl border border-error/30 bg-error/5 p-5 text-xs sm:text-sm text-foreground-secondary">
          <AlertTriangle className="h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="font-bold text-foreground">Không thể hoàn tất tra cứu</p>
            <p className="mt-0.5">{check.error instanceof Error ? check.error.message : "Vui lòng thử lại sau."}</p>
          </div>
        </div>
      ) : null}

      {/* Results */}
      {check.data && !check.isPending ? <UnifiedInteractionResults result={check.data} /> : null}
    </div>
  );
}
