"use client";

import { AlertTriangle, BookOpen, Pill, Sparkles } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import { useDrugDetails } from "@/queries/interactions";
import DrugInformationSkeleton from "./DrugInformationSkeleton";
import DrugSourcePanel from "./DrugSourcePanel";

interface DrugInformationDetailProps {
  id: string;
}

const SECTIONS = [
  { key: "summaryIndications", label: "Chỉ định" },
  { key: "summaryContraindications", label: "Chống chỉ định" },
  { key: "summaryDosage", label: "Liều dùng và cách dùng" },
  { key: "summaryPrecautions", label: "Thận trọng" },
  { key: "summarySideEffects", label: "Tác dụng không mong muốn" },
  { key: "specialNotes", label: "Lưu ý đặc biệt" },
] as const satisfies ReadonlyArray<{ key: keyof IDrugInformationDetail; label: string }>;

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl liquid-glass-subtle p-3">
      <dt className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">{label}</dt>
      <dd className="mt-1 text-xs font-bold text-foreground">{value}</dd>
    </div>
  );
}

function LeafletSection({ label, content }: { label: string; content: string }) {
  return (
    <section className="rounded-3xl liquid-glass p-5 sm:p-6 space-y-2.5">
      <h2 className="font-heading text-xs font-bold uppercase tracking-wider text-primary">{label}</h2>
      <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground-secondary">
        {content}
      </p>
    </section>
  );
}

export default function DrugInformationDetail({ id }: DrugInformationDetailProps) {
  const { data, isLoading, isError, error } = useDrugDetails(id);

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

  const sections: { label: string; content: string }[] = [];
  for (const section of SECTIONS) {
    const content = data[section.key];
    if (content) sections.push({ label: section.label, content });
  }

  const identity = [data.dosageForm, data.route, data.manufacturer].filter(Boolean);
  const hasLabels = Boolean(data.pharmacologicalClass) || typeof data.isPrescription === "boolean";

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <header className="rounded-3xl liquid-glass p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
          <Pill className="h-4 w-4" />
          <span>Dược thư chính thức</span>
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">{data.brandName}</h1>
        <p className="whitespace-pre-line text-xs sm:text-sm text-foreground-secondary">{data.ingredient}</p>

        {hasLabels ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {data.pharmacologicalClass ? (
              <Badge tone="glass">{data.pharmacologicalClass}</Badge>
            ) : null}
            {data.isPrescription === true ? <Badge tone="warning">Thuốc kê đơn (Rx)</Badge> : null}
            {data.isPrescription === false ? <Badge tone="success">Không kê đơn (OTC)</Badge> : null}
          </div>
        ) : null}
      </header>

      {/* Identity Stats Grid */}
      {identity.length > 0 ? (
        <dl className="grid gap-3 sm:grid-cols-3">
          <InfoRow label="Dạng bào chế" value={data.dosageForm} />
          <InfoRow label="Đường dùng" value={data.route} />
          <InfoRow label="Nhà sản xuất" value={data.manufacturer} />
        </dl>
      ) : null}

      {data.therapeuticEffect ? (
        <LeafletSection label="Tác dụng điều trị" content={data.therapeuticEffect} />
      ) : null}

      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <LeafletSection key={section.label} label={section.label} content={section.content} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-10 w-10 text-foreground-muted" aria-hidden />}
          title="Chưa có nội dung trích dẫn cho thuốc này"
          description="Danh mục đã có thuốc này nhưng chưa bóc tách được nội dung từ tờ hướng dẫn sử dụng gốc."
        />
      )}

      <DrugSourcePanel leafletUrl={data.leafletUrl ?? undefined} />
    </div>
  );
}
