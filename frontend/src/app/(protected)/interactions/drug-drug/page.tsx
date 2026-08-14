"use client";

import { AlertTriangle, Combine, Database, Search } from "lucide-react";
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
  const specialQueries = useMemo(() => ({
    "mang-thai": pregnancy.data?.items,
    "cho-con-bu": breastfeeding.data?.items,
  }), [pregnancy.data, breastfeeding.data]);

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
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">An toàn thuốc</p>
        <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">Tra cứu tương tác tổng hợp</h1>
        <p className="max-w-3xl text-sm leading-6 text-foreground-secondary">Đối chiếu thuốc–thuốc và thuốc–bệnh nền bằng bản ghi exact có trích dẫn. Gemini chỉ tóm tắt nội dung đã được xác thực.</p>
      </header>

      <HealthProfilePanel applied={appliedConditions} onAppliedChange={setAppliedConditions} />

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <DrugCatalogPicker label="Thuốc dùng trong lượt tra cứu" onSelect={(drug) => dispatch(addDrug(drug))} selectedIds={drugs.map((drug) => drug.id)} />
            <SelectedDrugList label="Thuốc đã xác nhận" drugs={drugs} onRemove={(id) => dispatch(removeDrug(id))} emptyHint="Chọn thuốc từ danh mục bệnh viện; không nhận tên tự do." />
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
        <div className="mt-6 border-t border-border pt-5">
          <Button size="md" disabled={!canCheck || check.isPending} onClick={() => check.mutate({ drugIds: drugs.map((drug) => drug.id), diseaseIds: allDiseases.map((disease) => disease.id) })}>
            {check.isPending ? <Search className="h-4 w-4 animate-pulse" aria-hidden /> : <Combine className="h-4 w-4" aria-hidden />}{check.isPending ? "AI đang tìm trong cơ sở dữ liệu…" : "Tra cứu tương tác"}
          </Button>
          {!canCheck ? <p className="mt-2 text-xs text-foreground-muted">Cần ít nhất hai thuốc, hoặc một thuốc kèm một bệnh/tình trạng được bạn xác nhận cho lượt này.</p> : null}
          {appliedConditions.length > confirmedSpecialDiseases.length ? <p className="mt-2 text-xs text-warning">Một tình trạng đặc biệt chưa resolve được đúng tên trong danh mục bệnh; chưa được gửi tra cứu.</p> : null}
        </div>
      </section>

      {check.isPending ? <div className="rounded-2xl border border-primary/20 bg-card p-6" role="status" aria-live="polite"><div className="flex items-start gap-4"><span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-hero-tint text-primary"><Database className="h-5 w-5" aria-hidden /><span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-primary/40" /></span><div><p className="font-semibold text-foreground">AI đang tìm kiếm trong cơ sở dữ liệu</p><p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-secondary">Hệ thống đang đối chiếu chính xác từng cặp thuốc và bệnh nền, sau đó kiểm tra trích dẫn trước khi hiển thị kết quả.</p></div></div><div className="mt-5"><TextSkeleton lines={5} /></div></div> : null}
      {check.isError ? <div role="alert" className="flex gap-3 rounded-2xl border border-error/30 bg-error/5 p-5 text-sm text-foreground-secondary"><AlertTriangle className="h-5 w-5 shrink-0 text-error" /><div><p className="font-semibold text-foreground">Không thể hoàn tất tra cứu</p><p className="mt-1">{check.error instanceof Error ? check.error.message : "Vui lòng thử lại."}</p></div></div> : null}
      {check.data && !check.isPending ? <UnifiedInteractionResults result={check.data} /> : null}
    </div>
  );
}
