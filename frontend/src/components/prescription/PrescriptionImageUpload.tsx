"use client";

import {
  AlertCircle,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ImageOff,
  LoaderCircle,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { useDiseaseSearch, useDrugSearch, useExtractPrescription } from "@/queries/interactions";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 25 * 1024 * 1024;
const MAX_IMAGES = 5;

interface ISelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface IEditableDrug {
  id: string;
  rawText: string;
  name: string;
  ingredient: string;
  uncertain: boolean;
  manuallyEdited: boolean;
  initialCandidates: IPrescriptionDrugCandidate[];
  selected: IDrugItem | null;
}

interface IEditableDisease {
  id: string;
  rawText: string;
  name: string;
  uncertain: boolean;
  manuallyEdited: boolean;
  initialCandidates: IPrescriptionDiseaseCandidate[];
  selected: IDiseaseItem | null;
}

interface PrescriptionImageUploadProps {
  embedded?: boolean;
  disabled?: boolean;
  disabledDescription?: string;
  selectedDrugIds?: string[];
  selectedDiseaseIds?: string[];
  onApplyDrugs?: (drugs: IDrugItem[]) => void;
  onApplyDiseases?: (diseases: IDiseaseItem[]) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedType(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) return true;
  return ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension));
}

function useDebouncedValue(value: string, delay = 350): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debounced;
}

function DrugReviewRow({
  row,
  onChange,
}: {
  row: IEditableDrug;
  onChange: (next: IEditableDrug) => void;
}) {
  const query = useDebouncedValue(row.name.trim());
  const search = useDrugSearch(query, row.manuallyEdited && query.length > 0, 5);
  const candidates: IDrugCandidate[] = row.manuallyEdited
    ? (search.data?.candidates ?? [])
    : row.initialCandidates;

  return (
    <li className="space-y-3 rounded-xl border border-border/70 bg-surface/25 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">Đọc từ ảnh: <span className="font-semibold text-foreground">“{row.rawText}”</span></p>
        {row.uncertain ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Ảnh chưa rõ
          </span>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="space-y-1 text-[11px] font-medium text-foreground-secondary">
          Tên thuốc
          <input
            value={row.name}
            onChange={(event) =>
              onChange({ ...row, name: event.target.value, selected: null, manuallyEdited: true })
            }
            className="min-h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
        <label className="space-y-1 text-[11px] font-medium text-foreground-secondary">
          Hoạt chất
          <input
            value={row.ingredient}
            onChange={(event) =>
              onChange({ ...row, ingredient: event.target.value, selected: null, manuallyEdited: true })
            }
            placeholder="Chưa đọc được từ ảnh"
            className="min-h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>
      </div>
      <div className="space-y-1.5 pt-1">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground-secondary">
          <Search className="h-3.5 w-3.5 text-primary" aria-hidden />
          Chọn đúng thuốc trong danh mục:
        </p>
        {search.isFetching ? <p className="text-[11px] text-foreground-muted">Đang tìm lại…</p> : null}
        {!search.isFetching && candidates.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground-secondary">
            Chưa tìm thấy thuốc phù hợp. Hãy sửa tên thuốc rồi chọn lại.
          </p>
        ) : null}
        <div className="grid gap-1.5">
          {candidates.map((candidate) => {
            const id = candidate.drugId;
            const selected = row.selected?.id === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange({
                    ...row,
                    name: candidate.brandName,
                    ingredient: candidate.ingredient,
                    manuallyEdited: false,
                    initialCandidates: candidates,
                    selected: { id, brandName: candidate.brandName, ingredient: candidate.ingredient },
                  })
                }
                className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-colors ${
                  selected
                    ? "border-primary/35 bg-primary/10 ring-1 ring-primary/15"
                    : "border-border/70 bg-background-elevated hover:border-primary/25 hover:bg-surface/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    selected ? "bg-primary text-white" : "border border-border/80"
                  }`}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-foreground">{candidate.brandName}</span>
                  <span className="block text-[11px] text-foreground-muted">{candidate.ingredient}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}

function DiseaseReviewRow({
  row,
  onChange,
}: {
  row: IEditableDisease;
  onChange: (next: IEditableDisease) => void;
}) {
  const query = useDebouncedValue(row.name.trim());
  const search = useDiseaseSearch(query, row.manuallyEdited && query.length > 0);
  const candidates: Array<IPrescriptionDiseaseCandidate | IDiseaseItem> = row.manuallyEdited
    ? (search.data?.items ?? [])
    : row.initialCandidates;

  return (
    <li className="space-y-3 rounded-xl border border-border/70 bg-surface/25 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted">Đọc từ ảnh: <span className="font-semibold text-foreground">“{row.rawText}”</span></p>
        {row.uncertain ? (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
            Ảnh chưa rõ
          </span>
        ) : null}
      </div>
      <label className="space-y-1 text-[11px] font-medium text-foreground-secondary">
        Bệnh/chẩn đoán
        <input
          value={row.name}
          onChange={(event) =>
            onChange({ ...row, name: event.target.value, selected: null, manuallyEdited: true })
          }
          className="min-h-10 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </label>
      <div className="space-y-1.5 pt-1">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground-secondary">
          <Search className="h-3.5 w-3.5 text-primary" aria-hidden />
          Chọn đúng bệnh trong danh mục:
        </p>
        {search.isFetching ? <p className="text-[11px] text-foreground-muted">Đang tìm lại…</p> : null}
        {!search.isFetching && candidates.length === 0 ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground-secondary">
            Chưa có bệnh phù hợp trong danh mục.
          </p>
        ) : null}
        <div className="grid gap-1.5">
          {candidates.map((candidate) => {
            const id = "diseaseId" in candidate ? candidate.diseaseId : candidate.id;
            const selected = row.selected?.id === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange({
                    ...row,
                    name: candidate.name,
                    manuallyEdited: false,
                    initialCandidates: candidates.map((value) => ({
                      diseaseId: "diseaseId" in value ? value.diseaseId : value.id,
                      name: value.name,
                      confidence: "confidence" in value ? value.confidence : 100,
                    })),
                    selected: { id, name: candidate.name },
                  })
                }
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs font-semibold transition-colors ${
                  selected
                    ? "border-primary/35 bg-primary/10 text-foreground ring-1 ring-primary/15"
                    : "border-border/70 bg-background-elevated text-foreground-secondary hover:border-primary/25 hover:bg-surface/40"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    selected ? "bg-primary text-white" : "border border-border/80"
                  }`}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                {candidate.name}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}

export default function PrescriptionImageUpload({
  embedded = false,
  disabled = false,
  disabledDescription,
  selectedDrugIds = [],
  selectedDiseaseIds = [],
  onApplyDrugs,
  onApplyDiseases,
}: PrescriptionImageUploadProps) {
  const [images, setImages] = useState<ISelectedImage[]>([]);
  const imagesRef = useRef<ISelectedImage[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(embedded);
  const [drugs, setDrugs] = useState<IEditableDrug[]>([]);
  const [diseases, setDiseases] = useState<IEditableDisease[]>([]);
  const [applied, setApplied] = useState(false);
  const extraction = useExtractPrescription();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);
  useEffect(
    () => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    []
  );

  const resetExtraction = () => {
    extraction.reset();
    setDrugs([]);
    setDiseases([]);
    setApplied(false);
  };

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const accepted: ISelectedImage[] = [];
    const nextErrors: string[] = [];
    const remainingSlots = MAX_IMAGES - images.length;
    if (files.length > remainingSlots) {
      nextErrors.push(`Chỉ được chọn tối đa ${MAX_IMAGES} ảnh cho cùng một đơn thuốc.`);
    }

    for (const file of files.slice(0, Math.max(0, remainingSlots))) {
      if (!isAcceptedType(file)) {
        nextErrors.push(`“${file.name}” không đúng định dạng. Chỉ nhận JPG, JPEG, PNG hoặc WEBP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.push(`“${file.name}” vượt quá 10 MB.`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    const totalSize = [...images, ...accepted].reduce((sum, image) => sum + image.file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      accepted.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      nextErrors.push("Tổng dung lượng ảnh không được vượt quá 25 MB.");
    } else if (accepted.length > 0) {
      setImages((current) => [...current, ...accepted]);
      resetExtraction();
    }
    setErrors(nextErrors);
  };

  const extract = () => {
    setErrors([]);
    setApplied(false);
    extraction.mutate(
      images.map((image) => image.file),
      {
        onSuccess: (result) => {
          setDrugs(
            result.drugs.map((drug) => ({
              id: crypto.randomUUID(),
              rawText: drug.rawText,
              name: drug.name,
              ingredient: drug.ingredient ?? "",
              uncertain: drug.uncertain,
              manuallyEdited: false,
              initialCandidates: drug.candidates,
              selected: null,
            }))
          );
          setDiseases(
            result.diseases.map((disease) => ({
              id: crypto.randomUUID(),
              rawText: disease.rawText,
              name: disease.name,
              uncertain: disease.uncertain,
              manuallyEdited: false,
              initialCandidates: disease.candidates,
              selected: null,
            }))
          );
        },
      }
    );
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== id);
    });
    resetExtraction();
  };

  const clearAll = () => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setErrors([]);
    resetExtraction();
  };

  const confirmedDrugs = drugs
    .map((drug) => drug.selected)
    .filter((drug): drug is IDrugItem => drug !== null && !selectedDrugIds.includes(drug.id));
  const confirmedDiseases = diseases
    .map((disease) => disease.selected)
    .filter((disease): disease is IDiseaseItem => disease !== null && !selectedDiseaseIds.includes(disease.id));
  const confirmedCount = confirmedDrugs.length + confirmedDiseases.length;

  const apply = () => {
    onApplyDrugs?.(confirmedDrugs);
    onApplyDiseases?.(confirmedDiseases);
    setApplied(true);
  };

  const panelId = `${inputId}-panel`;

  return (
    <section
      className={
        embedded
          ? ""
          : "overflow-hidden rounded-2xl border border-border/80 bg-background-elevated"
      }
      aria-label={embedded ? "Nhập thuốc từ ảnh đơn thuốc" : undefined}
    >
      {embedded ? null : (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Camera className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">
              Nhập từ ảnh đơn thuốc
            </span>
            <span className="mt-0.5 block text-[11px] leading-4 text-foreground-muted">
              OCR hỗ trợ nhập nhanh từ ảnh
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-foreground-muted transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
      )}

      {expanded ? (
        <div
          id={panelId}
          className={embedded ? "space-y-4" : "space-y-4 border-t border-border/70 p-4"}
        >
          {embedded ? null : (
            <p className="text-xs leading-5 text-foreground-secondary">
              Hệ thống đọc tên thuốc và chẩn đoán trên ảnh. Bạn cần xác nhận lại từng mục
              trước khi tra cứu.
            </p>
          )}

          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!disabled) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              if (!disabled && event.dataTransfer.files.length > 0) {
                addFiles(event.dataTransfer.files);
              }
            }}
            aria-disabled={disabled}
            className={`flex flex-col items-center gap-3 rounded-xl border border-dashed p-6 text-center transition-all sm:p-8 ${
              disabled
                ? "border-border/60 bg-surface/30 opacity-60"
                : isDragging
                  ? "scale-[1.01] border-primary bg-primary/5"
                  : "border-border bg-surface/20 hover:border-primary/40"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Upload className="h-5 w-5" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Kéo thả ảnh đơn thuốc vào đây</p>
              <p className="text-[11px] leading-4 text-foreground-muted">
                Tối đa 5 ảnh. JPG, PNG hoặc WEBP. Mỗi ảnh tối đa 10 MB.
              </p>
            </div>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              multiple
              accept={[...ACCEPTED_TYPES, ...ACCEPTED_EXTENSIONS].join(",")}
              onChange={(event) => {
                if (event.target.files?.length) addFiles(event.target.files);
                event.target.value = "";
              }}
              disabled={disabled}
              aria-describedby={errors.length > 0 ? errorId : undefined}
              className="sr-only"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              <Upload className="h-4 w-4" aria-hidden />
              <span>Chọn ảnh</span>
            </Button>
            {disabled && disabledDescription ? (
              <p className="text-xs text-foreground-muted">{disabledDescription}</p>
            ) : null}
          </div>

          {errors.length > 0 ? (
            <div
              id={errorId}
              role="alert"
              className="space-y-1 rounded-xl border border-error/30 bg-error/10 p-3"
            >
              {errors.map((message) => (
                <p key={message} className="flex items-start gap-1.5 text-xs text-error">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  {message}
                </p>
              ))}
            </div>
          ) : null}

          {images.length === 0 ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-surface/25 p-3 text-xs text-foreground-muted">
              <ImageOff className="h-4 w-4" aria-hidden /> Chưa có ảnh nào được chọn.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-foreground-secondary">
                  Đã chọn {images.length}/{MAX_IMAGES} ảnh
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  disabled={extraction.isPending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground-muted transition-colors hover:text-error disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Xóa tất cả
                </button>
              </div>
              <ul className={`grid gap-2 ${embedded ? "sm:grid-cols-2" : ""}`}>
                {images.map((image) => (
                  <li
                    key={image.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/25 p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- blob URL cục bộ */}
                    <img
                      src={image.previewUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {image.file.name}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        {formatFileSize(image.file.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      disabled={extraction.isPending}
                      aria-label={`Xóa ${image.file.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button
                variant="solid"
                size="md"
                className="w-full"
                onClick={extract}
                disabled={extraction.isPending}
              >
                {extraction.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden />
                )}
                {extraction.isPending ? "Đang đọc đơn thuốc..." : "Nhận diện nội dung"}
              </Button>
            </div>
          )}

          {extraction.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-error/30 bg-error/5 p-3 text-xs leading-5 text-foreground-secondary"
            >
              <p className="font-semibold text-error">Không thể đọc ảnh</p>
              <p>
                {extraction.error instanceof Error
                  ? extraction.error.message
                  : "Vui lòng thử lại."}
              </p>
            </div>
          ) : null}

          {extraction.isPending ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl border border-border/70 bg-surface/30 p-4"
            >
              <div className="flex items-start gap-3">
                <LoaderCircle
                  className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary"
                  aria-hidden
                />
                <div>
                  <p className="text-xs font-semibold text-foreground">Đang xử lý hình ảnh</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-foreground-secondary">
                    Hệ thống đang bóc tách và đối chiếu với danh mục thuốc chuẩn.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {extraction.isSuccess ? (
            <div className="space-y-4 border-t border-border/70 pt-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Xác nhận kết quả nhận diện</h3>
                <p className="mt-0.5 text-[11px] leading-4 text-foreground-muted">
                  Chọn đúng thuốc và bệnh trước khi thêm vào lần tra cứu.
                </p>
              </div>

              {drugs.length > 0 ? (
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold text-primary">
                    Thuốc nhận diện ({drugs.length})
                  </h4>
                  <ul className="space-y-2.5">
                    {drugs.map((row) => (
                      <DrugReviewRow
                        key={row.id}
                        row={row}
                        onChange={(next) =>
                          setDrugs((current) =>
                            current.map((item) => (item.id === next.id ? next : item))
                          )
                        }
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              {diseases.length > 0 ? (
                <section className="space-y-2">
                  <h4 className="text-xs font-semibold text-primary">
                    Bệnh nhận diện ({diseases.length})
                  </h4>
                  <ul className="space-y-2.5">
                    {diseases.map((row) => (
                      <DiseaseReviewRow
                        key={row.id}
                        row={row}
                        onChange={(next) =>
                          setDiseases((current) =>
                            current.map((item) => (item.id === next.id ? next : item))
                          )
                        }
                      />
                    ))}
                  </ul>
                </section>
              ) : null}

              {drugs.length + diseases.length > 0 ? (
                <div className="space-y-2 pt-2">
                  <Button
                    variant="solid"
                    size="md"
                    className="w-full"
                    onClick={apply}
                    disabled={confirmedCount === 0}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span>Thêm {confirmedCount} mục đã xác nhận</span>
                  </Button>
                  {applied ? (
                    <p
                      role="status"
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-success"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Đã cập nhật lần tra cứu.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
