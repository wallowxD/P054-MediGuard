"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Combine,
  Database,
  Info,
  Pill,
  Search,
  Stethoscope,
} from "lucide-react";
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
  const [inputMode, setInputMode] = useState<"manual" | "prescription">("manual");
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
  const missingInstruction =
    drugs.length === 0
      ? "Chọn ít nhất một thuốc để bắt đầu."
      : drugs.length === 1 && allDiseases.length === 0
        ? "Chọn thêm một thuốc hoặc một bệnh nền."
        : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <header className="flex items-start gap-4">
        <span className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(0,102,204,0.2)]">
          <Combine className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tra cứu tương tác thuốc
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-secondary">
            Chọn thuốc và bệnh nền cần kiểm tra. Kết quả luôn đi kèm trích dẫn từ tài liệu nguồn.
          </p>
        </div>
      </header>

      <HealthProfilePanel applied={appliedConditions} onAppliedChange={setAppliedConditions} />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section
          className="overflow-hidden rounded-2xl border border-border/80 bg-background-elevated shadow-[0_16px_42px_rgba(30,64,110,0.07)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
          aria-labelledby="lookup-input-title"
        >
          <div className="border-b border-border/70 px-5 pb-4 pt-5 sm:px-6 sm:pb-5">
            <h2 id="lookup-input-title" className="text-lg font-semibold text-foreground">
              Thêm thuốc vào lần tra cứu
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Nhập trực tiếp hoặc tải ảnh đơn thuốc. Bạn có thể chuyển cách nhập bất kỳ lúc nào.
            </p>

            <div
              className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-surface/55 p-1"
              role="tablist"
              aria-label="Cách thêm thuốc"
            >
              <button
                type="button"
                id="manual-input-tab"
                role="tab"
                aria-selected={inputMode === "manual"}
                aria-controls="manual-input-panel"
                onClick={() => setInputMode("manual")}
                className={`flex min-h-14 items-center gap-3 rounded-lg px-3.5 text-left transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  inputMode === "manual"
                    ? "bg-background-elevated text-primary shadow-sm"
                    : "text-foreground-secondary hover:bg-background-elevated/55 hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    inputMode === "manual" ? "bg-primary/10 text-primary" : "bg-surface text-foreground-muted"
                  }`}
                >
                  <Pill className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Nhập tên thuốc</span>
                  <span className="mt-0.5 hidden text-[11px] text-foreground-muted sm:block">
                    Tìm và chọn trong danh mục
                  </span>
                </span>
              </button>

              <button
                type="button"
                id="prescription-input-tab"
                role="tab"
                aria-selected={inputMode === "prescription"}
                aria-controls="prescription-input-panel"
                onClick={() => setInputMode("prescription")}
                className={`flex min-h-14 items-center gap-3 rounded-lg px-3.5 text-left transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  inputMode === "prescription"
                    ? "bg-background-elevated text-primary shadow-sm"
                    : "text-foreground-secondary hover:bg-background-elevated/55 hover:text-foreground"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    inputMode === "prescription"
                      ? "bg-primary/10 text-primary"
                      : "bg-surface text-foreground-muted"
                  }`}
                >
                  <Camera className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Ảnh đơn thuốc</span>
                  <span className="mt-0.5 hidden text-[11px] text-foreground-muted sm:block">
                    OCR hỗ trợ nhận diện nhanh
                  </span>
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-7 p-5 sm:p-6">
            <div
              id="manual-input-panel"
              role="tabpanel"
              aria-labelledby="manual-input-tab"
              hidden={inputMode !== "manual"}
              className="space-y-4"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">Tìm thuốc</h3>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Bắt buộc
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-foreground-muted">
                  Nhập tên trên hộp thuốc hoặc tên hoạt chất rồi chọn kết quả phù hợp.
                </p>
              </div>
              <DrugCatalogPicker
                label="Tên thuốc hoặc hoạt chất"
                onSelect={(drug) => dispatch(addDrug(drug))}
                selectedIds={drugs.map((drug) => drug.id)}
              />
            </div>

            <div
              id="prescription-input-panel"
              role="tabpanel"
              aria-labelledby="prescription-input-tab"
              hidden={inputMode !== "prescription"}
            >
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">Nhận diện từ ảnh đơn thuốc</h3>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Nhập nhanh
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-foreground-muted">
                  Tải ảnh rõ nét. Bạn sẽ xác nhận lại từng thuốc trước khi thêm vào lần tra cứu.
                </p>
              </div>
              <PrescriptionImageUpload
                embedded
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

            <div className="border-t border-border/70 pt-6">
              <SelectedDrugList
                label="Thuốc đã chọn"
                drugs={drugs}
                onRemove={(id) => dispatch(removeDrug(id))}
                emptyHint={
                  inputMode === "manual"
                    ? "Tìm và chọn thuốc ở phía trên."
                    : "Thuốc đã xác nhận từ ảnh sẽ xuất hiện tại đây."
                }
              />
            </div>

            <div className="border-t border-border/70 pt-6">
              <div className="grid gap-4 sm:grid-cols-[2.75rem_minmax(0,1fr)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-foreground-secondary">
                  <Stethoscope className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                </span>
                <div className="min-w-0 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">Thêm bệnh nền</h3>
                      <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
                        Không bắt buộc
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-foreground-muted">
                      Bỏ qua nếu bạn chỉ cần kiểm tra giữa các thuốc.
                    </p>
                  </div>
                  <DiseaseAutocomplete selected={diseases} onChange={setDiseases} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="xl:sticky xl:top-6" aria-label="Tóm tắt lượt tra cứu">
          <section className="rounded-2xl border border-border/80 bg-background-elevated p-5 shadow-[0_14px_36px_rgba(30,64,110,0.06)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Kiểm tra trước khi tra cứu</h2>
                <p className="mt-0.5 text-xs leading-5 text-foreground-muted">
                  Xác nhận nhanh thông tin bạn sắp gửi.
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 rounded-xl bg-surface/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <Pill className="h-4 w-4 text-primary" aria-hidden /> Thuốc
                </dt>
                <dd className="font-semibold tabular-nums text-foreground">{drugs.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <Stethoscope className="h-4 w-4 text-primary" aria-hidden /> Bệnh nền
                </dt>
                <dd className="font-semibold tabular-nums text-foreground">{allDiseases.length}</dd>
              </div>
            </dl>

            <div
              className={`mt-4 flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-xs leading-5 ${
                canCheck
                  ? "bg-success/10 text-foreground-secondary"
                  : "bg-primary/10 text-foreground-secondary"
              }`}
              role="status"
            >
              {canCheck ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              )}
              <span>{canCheck ? "Đã đủ thông tin để tra cứu." : missingInstruction}</span>
            </div>

            <Button
              variant="solid"
              size="md"
              className="mt-4 min-h-12 w-full px-4"
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
              <span>{check.isPending ? "Đang đối chiếu dữ liệu..." : "Tra cứu tương tác"}</span>
            </Button>

            {appliedConditions.length > confirmedSpecialDiseases.length ? (
              <p className="mt-3 text-xs leading-5 text-warning">
                Một tình trạng đặc biệt chưa khớp danh mục nên chưa được đưa vào tra cứu.
              </p>
            ) : null}

            <p className="mt-4 border-t border-border/70 pt-4 text-[11px] leading-5 text-foreground-muted">
              Kết quả mang tính tham khảo, không thay thế đánh giá của bác sĩ hoặc dược sĩ.
            </p>
          </section>
        </aside>
      </div>

      {check.isPending ? (
        <div
          className="rounded-2xl border border-border/80 bg-background-elevated p-5 sm:p-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-4">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" aria-hidden />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full bg-primary" />
            </span>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">
                Đang đối chiếu với cơ sở dữ liệu
              </p>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-foreground-secondary">
                Hệ thống kiểm tra từng cặp chính xác và xác thực trích dẫn trước khi hiển thị.
              </p>
            </div>
          </div>
          <div className="mt-5">
            <TextSkeleton lines={3} />
          </div>
        </div>
      ) : null}

      {check.isError ? (
        <div
          role="alert"
          className="flex gap-3 rounded-2xl border border-error/30 bg-error/5 p-5 text-sm text-foreground-secondary"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-error" />
          <div>
            <p className="font-semibold text-foreground">Không thể hoàn tất tra cứu</p>
            <p className="mt-1">
              {check.error instanceof Error ? check.error.message : "Vui lòng thử lại sau."}
            </p>
          </div>
        </div>
      ) : null}

      {check.data && !check.isPending ? <UnifiedInteractionResults result={check.data} /> : null}
    </div>
  );
}
