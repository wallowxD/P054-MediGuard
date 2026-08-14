"use client";

import { AlertTriangle, BookOpen } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/ui/Badge";
import { useDrugDetails } from "@/queries/interactions";
import DrugInformationSkeleton from "./DrugInformationSkeleton";
import DrugSourcePanel from "./DrugSourcePanel";

interface DrugInformationDetailProps {
  id: string;
}

/**
 * Nội dung chính của `/drug-information/[id]`, đọc từ `GET /api/v1/drugs/{id}`.
 *
 * Mọi mục bên dưới là đoạn TRÍCH NGUYÊN VĂN từ tờ HDSD do backend đọc lại từ bảng `drugs`;
 * component không tóm tắt, không đổi từ ngữ và không tự điền chỗ trống. Mục nào backend trả
 * `null` thì ẩn hẳn — viết "không có chống chỉ định" cho một thuốc mà nguồn chỉ đơn giản là
 * thiếu mục đó chính là bịa nội dung (luật số 1 của dự án).
 */

/** Thứ tự đọc theo tờ HDSD: dùng thuốc → giới hạn → cách dùng → rủi ro. */
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
    <div>
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function LeafletSection({ label, content }: { label: string; content: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      {/* whitespace-pre-line: nội dung là đoạn nguyên văn, bước bóc tách giữ lại gạch đầu
          dòng và ngắt dòng thật của tờ HDSD. Gộp thành một khối sẽ làm mất cấu trúc đó. */}
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground-secondary">
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
          icon={<AlertTriangle className="h-10 w-10" aria-hidden />}
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
      <header className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">{data.brandName}</h1>
        <p className="whitespace-pre-line text-sm text-foreground-secondary">{data.ingredient}</p>

        {/* `isPrescription` có ba trạng thái; `null`/`undefined` là nguồn không nói rõ nên
            không gắn nhãn nào, khác hẳn với việc khẳng định thuốc không cần đơn. */}
        {hasLabels ? (
          <div className="flex flex-wrap items-center gap-2">
            {data.pharmacologicalClass ? (
              <Badge tone="neutral">{data.pharmacologicalClass}</Badge>
            ) : null}
            {data.isPrescription === true ? <Badge tone="warning">Thuốc kê đơn</Badge> : null}
            {data.isPrescription === false ? <Badge tone="success">Không kê đơn</Badge> : null}
          </div>
        ) : null}
      </header>

      {identity.length > 0 ? (
        <dl className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-3 sm:p-5">
          <InfoRow label="Dạng bào chế" value={data.dosageForm} />
          <InfoRow label="Đường dùng" value={data.route} />
          <InfoRow label="Nhà sản xuất" value={data.manufacturer} />
        </dl>
      ) : null}

      {data.therapeuticEffect ? (
        <LeafletSection label="Tác dụng" content={data.therapeuticEffect} />
      ) : null}

      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section) => (
            <LeafletSection key={section.label} label={section.label} content={section.content} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" aria-hidden />}
          title="Chưa có nội dung trích dẫn cho thuốc này"
          description="Danh mục đã có thuốc này nhưng chưa bóc tách được nội dung từ tờ hướng dẫn sử dụng. Hệ thống không suy đoán thay cho tài liệu gốc."
        />
      )}

      <DrugSourcePanel leafletUrl={data.leafletUrl ?? undefined} />
    </div>
  );
}
