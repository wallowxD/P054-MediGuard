"use client";

import { AlertTriangle, BookOpen, Pill } from "lucide-react";
import { useEffect } from "react";
import EmptyState from "@/components/EmptyState";
import { useChat } from "@/context/ChatContext";
import { useDrugDetails } from "@/queries/interactions";
import DrugInformationSkeleton from "./DrugInformationSkeleton";
import DrugSourcePanel from "./DrugSourcePanel";

interface DrugInformationDetailProps {
  id: string;
}

const SECTIONS = [
  { key: "summaryIndications", id: "chi-dinh", label: "Chỉ định" },
  { key: "summaryContraindications", id: "chong-chi-dinh", label: "Chống chỉ định" },
  { key: "summaryDosage", id: "lieu-dung", label: "Liều dùng và cách dùng" },
  { key: "summaryPrecautions", id: "than-trong", label: "Thận trọng" },
  {
    key: "summarySideEffects",
    id: "tac-dung-khong-mong-muon",
    label: "Tác dụng không mong muốn",
  },
  { key: "specialNotes", id: "luu-y-dac-biet", label: "Lưu ý đặc biệt" },
] as const satisfies ReadonlyArray<{
  key: keyof IDrugInformationDetail;
  id: string;
  label: string;
}>;

const DOCUMENT_SECTIONS = [
  { key: "therapeuticEffect", id: "tac-dung-dieu-tri", label: "Tác dụng điều trị" },
  ...SECTIONS,
] as const satisfies ReadonlyArray<{
  key: keyof IDrugInformationDetail;
  id: string;
  label: string;
}>;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="min-w-0 border-t border-border/70 py-3.5 first:border-t-0 sm:border-l sm:border-t-0 sm:px-5 sm:py-0 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground-muted">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold leading-5 text-foreground">{value}</dd>
    </div>
  );
}

function LeafletSection({
  id,
  index,
  label,
  content,
}: {
  id: string;
  index: number;
  label: string;
  content: string;
}) {
  return (
    <section id={id} className="scroll-mt-6 px-5 py-6 sm:px-7 sm:py-8">
      <div className="grid gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-5">
        <span className="font-heading text-xs font-semibold tabular-nums tracking-[0.12em] text-primary/70">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {label}
          </h2>
          <p className="mt-3 max-w-[78ch] whitespace-pre-line text-sm leading-7 text-foreground-secondary sm:text-[15px]">
            {content}
          </p>
        </div>
      </div>
    </section>
  );
}

export default function DrugInformationDetail({ id }: DrugInformationDetailProps) {
  const { data, isLoading, isError, error } = useDrugDetails(id);
  const { registerDrugContext } = useChat();

  // Nạp tờ HDSD đang mở làm ngữ cảnh cho trợ lý AI: đúng những đoạn nguyên văn hiển thị
  // trên trang này, không nguồn nào khác. Rời trang thì gỡ đăng ký, nếu không trợ lý sẽ
  // còn bám tờ HDSD cũ ở màn hình khác.
  useEffect(() => {
    if (!data) return;

    const leafletSections: Record<string, string> = {};
    if (data.therapeuticEffect) leafletSections["Tác dụng điều trị"] = data.therapeuticEffect;
    for (const section of SECTIONS) {
      const content = data[section.key];
      if (content) leafletSections[section.label] = content;
    }

    registerDrugContext({
      drugId: data.id,
      brandName: data.brandName,
      ingredient: data.ingredient,
      leafletUrl: data.leafletUrl,
      sections: leafletSections,
    });

    return () => registerDrugContext(null);
  }, [data, registerDrugContext]);

  if (isLoading) return <DrugInformationSkeleton />;

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={<AlertTriangle className="h-10 w-10 text-error" aria-hidden />}
          title="Chưa thể tải thông tin thuốc"
          description={
            error instanceof Error ? error.message : "Không thể tải thông tin thuốc. Vui lòng thử lại."
          }
        />
        <DrugSourcePanel />
      </div>
    );
  }

  const sections: { id: string; label: string; content: string }[] = [];
  for (const section of DOCUMENT_SECTIONS) {
    const content = data[section.key];
    if (typeof content === "string" && content.trim()) {
      sections.push({ id: section.id, label: section.label, content });
    }
  }

  const identity = [data.dosageForm, data.route, data.manufacturer].filter(Boolean);
  const hasLabels = Boolean(data.pharmacologicalClass) || typeof data.isPrescription === "boolean";

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] bg-surface/45 p-1 ring-1 ring-black/[0.04] shadow-[0_24px_70px_-42px_rgba(30,64,110,0.42)] dark:ring-white/[0.07] dark:shadow-[0_28px_76px_-44px_rgba(0,0,0,0.82)]">
        <header className="overflow-hidden rounded-[1.5rem] bg-background-elevated px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-7 sm:py-7">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary">
              <Pill className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              <span>Hồ sơ thông tin thuốc</span>
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
              {data.brandName}
            </h1>
            <p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-6 text-foreground-secondary sm:text-base">
              {data.ingredient}
            </p>

            {hasLabels ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {data.isPrescription === true ? (
                  <span className="inline-flex items-center rounded-lg border border-warning/20 bg-warning/8 px-2.5 py-1 text-xs font-semibold text-warning">
                    Thuốc kê đơn (Rx)
                  </span>
                ) : null}
                {data.isPrescription === false ? (
                  <span className="inline-flex items-center rounded-lg border border-success/20 bg-success/8 px-2.5 py-1 text-xs font-semibold text-success">
                    Không kê đơn (OTC)
                  </span>
                ) : null}
                {data.pharmacologicalClass ? (
                  <span className="inline-flex items-center rounded-lg border border-border/80 bg-surface/60 px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                    {data.pharmacologicalClass}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {identity.length > 0 ? (
            <dl className="mt-6 grid border-t border-border/70 pt-2 sm:grid-cols-3 sm:pt-5">
              <InfoRow label="Dạng bào chế" value={data.dosageForm} />
              <InfoRow label="Đường dùng" value={data.route} />
              <InfoRow label="Nhà sản xuất" value={data.manufacturer} />
            </dl>
          ) : null}
        </header>
      </div>

      {sections.length > 0 ? (
        <div className="grid items-start gap-5 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
          <nav
            aria-label="Mục lục thông tin thuốc"
            className="rounded-2xl border border-border/80 bg-background-elevated p-3 shadow-[0_14px_36px_rgba(30,64,110,0.055)] dark:shadow-[0_16px_38px_rgba(0,0,0,0.2)] lg:sticky lg:top-6"
          >
            <div className="px-2 pb-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-muted">
                Nội dung
              </p>
              <p className="mt-1 text-xs leading-5 text-foreground-secondary">
                Chọn mục cần xem nhanh.
              </p>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-medium text-foreground-secondary transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/7 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] lg:w-full"
                >
                  <span className="text-[10px] font-semibold tabular-nums text-foreground-muted group-hover:text-primary/70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="whitespace-nowrap lg:whitespace-normal">{section.label}</span>
                </a>
              ))}
            </div>
          </nav>

          <div className="rounded-[1.75rem] bg-surface/40 p-1 ring-1 ring-black/[0.035] dark:ring-white/[0.06]">
            <article className="divide-y divide-border/70 overflow-hidden rounded-[1.5rem] bg-background-elevated shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <header className="px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
                  </span>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      Nội dung tờ hướng dẫn sử dụng
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-foreground-secondary sm:text-sm sm:leading-6">
                      Các mục dưới đây được hiển thị theo hồ sơ thuốc trong danh mục bệnh viện.
                    </p>
                  </div>
                </div>
              </header>

              {sections.map((section, index) => (
                <LeafletSection
                  key={section.id}
                  id={section.id}
                  index={index}
                  label={section.label}
                  content={section.content}
                />
              ))}
            </article>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-10 w-10 text-foreground-muted" aria-hidden />}
          title="Chưa có nội dung trích dẫn cho thuốc này"
          description="Danh mục đã có thuốc này nhưng chưa bóc tách được nội dung từ tờ hướng dẫn sử dụng gốc."
        />
      )}

      <DrugSourcePanel leafletUrl={data.leafletUrl ?? undefined} drugName={data.brandName} />
    </div>
  );
}
