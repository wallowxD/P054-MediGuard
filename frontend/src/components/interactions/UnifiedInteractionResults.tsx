"use client";

import {
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Info,
  Pill,
  Plus,
  Stethoscope,
  Utensils,
  Wheat,
} from "lucide-react";
import { useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import ReviewStatusTag from "./ReviewStatusTag";
import SeverityBadge from "./SeverityBadge";

type InteractionContent = IInteractionItem | IInteractionCheckResponse["notes"][number];

const SEVERITY_ACCENT_STYLE: Record<TSeverity, string> = {
  contraindicated: "bg-red-500",
  major: "bg-orange-500",
  moderate: "bg-amber-500",
  minor: "bg-sky-500",
  unknown: "bg-slate-400",
};

function splitObjectLabel(value: string) {
  const separatorIndex = value.indexOf(" — ");

  if (separatorIndex === -1) return { primary: value, qualifier: null };

  return {
    primary: value.slice(0, separatorIndex),
    qualifier: value.slice(separatorIndex + 3),
  };
}

const KIND_LABEL: Record<IInteractionItem["kind"], string> = {
  "drug-drug": "Thuốc với thuốc",
  "drug-disease": "Thuốc với bệnh nền",
  "drug-food": "Thực phẩm và đồ uống",
  "drug-supplement": "Thực phẩm bổ sung và thảo dược",
};

function EvidenceDetails({ item }: { item: InteractionContent }) {
  const effect = item.effectDescription ?? item.consequence;
  const managementBullets = item.aiSummary.managementBullets;
  const normalizedWarning = item.aiSummary.warning.trim().toLocaleLowerCase("vi-VN");
  const distinctEffect = effect && effect.trim().toLocaleLowerCase("vi-VN") !== normalizedWarning ? effect : null;
  const hasClinicalDetail = Boolean(item.mechanism || distinctEffect || managementBullets.length || item.management);

  return (
    <details className="group mt-6">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-xl bg-surface/35 px-4 text-sm font-semibold text-foreground transition-[background-color,color] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <FileText className="h-4 w-4 text-primary" strokeWidth={1.6} aria-hidden />
          <span>Hướng dẫn và tài liệu nguồn</span>
          <span className="hidden text-xs font-normal text-foreground-muted sm:inline">
            {item.citations.length} nguồn đối chiếu
          </span>
          <ReviewStatusTag status={item.reviewStatus} compact />
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-foreground-muted transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div
        className={`grid gap-5 pb-1 pt-5 ${
          hasClinicalDetail ? "lg:grid-cols-[minmax(0,0.9fr)_minmax(22rem,1.1fr)]" : ""
        }`}
      >
        {hasClinicalDetail ? (
          <div className="space-y-6 px-1 py-1">
            {managementBullets.length || item.management ? (
              <section>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Hướng dẫn sử dụng
                </p>
                {managementBullets.length ? (
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-foreground-secondary">
                    {managementBullets.map((value, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-foreground-secondary">{item.management}</p>
                )}
              </section>
            ) : null}

            {item.mechanism || distinctEffect ? (
              <section className="border-t border-border/60 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                  Thông tin chi tiết
                </p>
                {item.mechanism ? (
                  <p className="mt-3 text-sm leading-6 text-foreground-secondary">{item.mechanism}</p>
                ) : null}
                {distinctEffect ? (
                  <p className="mt-3 text-sm leading-6 text-foreground-secondary">{distinctEffect}</p>
                ) : null}
              </section>
            ) : null}
          </div>
        ) : null}

        <aside className="rounded-2xl bg-surface/30 p-4 sm:p-5" aria-label="Bằng chứng từ tài liệu nguồn">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
            Bằng chứng từ tờ hướng dẫn sử dụng
          </p>

          <div className="mt-4 space-y-5">
            {item.citations.map((citation) => (
              <figure key={citation.evidenceId} className="space-y-3">
                <blockquote className="border-l-2 border-primary/35 pl-4 text-sm italic leading-6 text-foreground-secondary">
                  “{citation.quote}”
                </blockquote>
                <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-muted">
                  <a
                    href={citation.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/link inline-flex items-center gap-1.5 font-semibold text-primary transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-primary-hover focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Tài liệu gốc
                    <ExternalLink
                      className="h-3 w-3 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                      strokeWidth={1.7}
                      aria-hidden
                    />
                  </a>
                  <span aria-hidden>·</span>
                  <span>{citation.source}</span>
                  {citation.page ? <span>· Trang {citation.page}</span> : null}
                  {citation.section ? <span>· Mục {citation.section}</span> : null}
                </figcaption>
              </figure>
            ))}
          </div>
        </aside>
      </div>
    </details>
  );
}

function UsageNoteCard({ item }: { item: IInteractionCheckResponse["notes"][number] }) {
  return (
    <div className="rounded-[1.5rem] bg-surface/40 p-1 ring-1 ring-black/[0.035] dark:ring-white/[0.06]">
      <article className="rounded-[1.25rem] bg-background-elevated px-5 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-6 sm:pb-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
              {KIND_LABEL[item.kind]}
            </p>
            <h4 className="mt-1.5 text-wrap-balance font-heading text-lg font-bold tracking-tight text-foreground">
              {item.subject} + {item.object}
            </h4>
          </div>
          <SeverityBadge severity={item.severity} />
        </header>

        <div className="mt-4 grid grid-cols-[3px_minmax(0,1fr)] gap-4 rounded-r-xl bg-primary/[0.035] py-3.5 pr-4">
          <span className="rounded-full bg-primary/45" aria-hidden />
          <p className="text-sm leading-6 text-foreground-secondary">{item.aiSummary.warning}</p>
        </div>

        <EvidenceDetails item={item} />
      </article>
    </div>
  );
}

function InteractionCard({ item, prominent = false }: { item: IInteractionItem; prominent?: boolean }) {
  const objectLabel = splitObjectLabel(item.object);
  const objectTypeLabel = item.kind === "drug-disease" ? "Bệnh nền liên quan" : "Thuốc dùng cùng";

  return (
    <div className="rounded-[1.75rem] bg-surface/45 p-1 ring-1 ring-black/[0.04] shadow-[0_24px_70px_-42px_rgba(30,64,110,0.42)] dark:ring-white/[0.07] dark:shadow-[0_28px_76px_-44px_rgba(0,0,0,0.82)]">
      <article className="relative overflow-hidden rounded-[1.5rem] bg-background-elevated px-5 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-7 sm:pb-7 sm:pt-7">
        <div
          className={`absolute left-7 top-0 h-1 w-14 rounded-b-full ${SEVERITY_ACCENT_STYLE[item.severity]}`}
          aria-hidden
        />

        <header className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground-muted">
            {prominent ? "Cảnh báo ưu tiên" : KIND_LABEL[item.kind]}
          </p>
          <SeverityBadge severity={item.severity} />
        </header>

        {prominent ? (
          <div className="mt-6 grid items-stretch gap-3 md:grid-cols-[minmax(0,0.72fr)_2.75rem_minmax(0,1.28fr)]">
            <section className="rounded-2xl bg-surface/25 px-4 py-4 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">Thuốc</p>
              <h3 className="mt-2 font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {item.subject}
              </h3>
            </section>

            <span className="mx-auto flex h-11 w-11 self-center items-center justify-center rounded-full bg-primary/8 text-primary">
              <Plus className="h-4 w-4" strokeWidth={1.8} aria-hidden />
            </span>

            <section className="rounded-2xl bg-surface/25 px-4 py-4 sm:px-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                {objectTypeLabel}
              </p>
              <h3 className="mt-2 text-wrap-balance font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {objectLabel.primary}
              </h3>
              {objectLabel.qualifier ? (
                <p className="mt-1.5 text-xs leading-5 text-foreground-muted">{objectLabel.qualifier}</p>
              ) : null}
            </section>
          </div>
        ) : (
          <h3 className="mt-4 text-wrap-balance font-heading text-lg font-bold tracking-tight text-foreground">
            {item.subject} + {item.object}
          </h3>
        )}

        <div className="mt-5 grid grid-cols-[3px_minmax(0,1fr)] gap-4 rounded-r-xl bg-primary/[0.035] py-4 pr-4">
          <span className="rounded-full bg-primary/50" aria-hidden />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Điều cần lưu ý</p>
            <p className="mt-1.5 max-w-4xl text-sm font-medium leading-6 text-foreground sm:text-[15px]">
              {item.aiSummary.warning}
            </p>
          </div>
        </div>

        <EvidenceDetails item={item} />
      </article>
    </div>
  );
}

export default function UnifiedInteractionResults({ result }: { result: IInteractionCheckResponse }) {
  const { registerResult } = useChat();

  useEffect(() => registerResult(result), [result, registerResult]);

  const highlight = result.items.find((item) => item.id === result.highlightId);
  const remainingItems = highlight ? result.items.filter((item) => item.id !== highlight.id) : result.items;
  const hasPrimaryWarnings = result.items.length > 0;
  const hasUsageNotes = result.notes.length > 0;
  const noteGroups = [
    {
      id: "food-and-drink-notes",
      title: "Thực phẩm và đồ uống",
      icon: Utensils,
      items: result.notes.filter((item) => item.kind === "drug-food"),
    },
    {
      id: "supplement-notes",
      title: "Thực phẩm bổ sung và thảo dược",
      icon: Wheat,
      items: result.notes.filter((item) => item.kind === "drug-supplement"),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="space-y-6" aria-live="polite" aria-labelledby="interaction-result-title">
      {result.historyStatus === "not-saved" ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-xs leading-5 text-foreground-secondary">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
          <span>Lượt tra cứu này chưa được lưu vào lịch sử, nhưng kết quả bên dưới vẫn đầy đủ.</span>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] bg-surface/35 p-1 ring-1 ring-black/[0.035] dark:ring-white/[0.06]">
        <header className="rounded-[1.25rem] bg-background-elevated px-5 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-7 sm:pb-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {hasPrimaryWarnings ? (
                  <AlertTriangle className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                ) : (
                  <ClipboardCheck className="h-5 w-5" strokeWidth={1.9} aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Kết quả tra cứu</p>
                <h2
                  id="interaction-result-title"
                  className="mt-1 max-w-3xl text-wrap-balance font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                >
                  {hasPrimaryWarnings
                    ? `${result.items.length} cảnh báo cần xem`
                    : hasUsageNotes
                      ? `${result.notes.length} lưu ý cần đọc`
                      : "Chưa tìm thấy cảnh báo có đủ trích dẫn"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-secondary">
                  {hasPrimaryWarnings
                    ? "Đọc cảnh báo được ưu tiên trước, rồi mở chi tiết nếu bạn cần xem cơ chế hoặc tài liệu nguồn."
                    : "Không tìm thấy cảnh báo thuốc với thuốc hoặc thuốc với bệnh nền trong dữ liệu hiện có. Điều này không đồng nghĩa các thuốc chắc chắn an toàn khi dùng cùng nhau."}
                </p>
              </div>
            </div>

            <a
              href="#lookup-input-title"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start text-xs font-semibold text-primary transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-primary-hover focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
              Điều chỉnh tra cứu
            </a>
          </div>

          <div className="mt-5 grid gap-2 border-t border-border/70 pt-4 text-xs text-foreground-secondary sm:grid-cols-2">
            <p className="flex items-start gap-2">
              <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="font-semibold text-foreground">Thuốc:</strong>{" "}
                {result.drugs.map((drug) => drug.brandName).join(", ")}
              </span>
            </p>
            {result.diseases.length ? (
              <p className="flex items-start gap-2">
                <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <strong className="font-semibold text-foreground">Bệnh nền:</strong>{" "}
                  {result.diseases.map((disease) => disease.name).join(", ")}
                </span>
              </p>
            ) : null}
          </div>
        </header>
      </div>

      {highlight ? <InteractionCard item={highlight} prominent /> : null}

      {remainingItems.length ? (
        <section className="space-y-3" aria-labelledby="other-interactions-title">
          <header>
            <h2 id="other-interactions-title" className="font-heading text-lg font-bold text-foreground">
              {highlight ? `Cảnh báo khác (${remainingItems.length})` : `Cảnh báo (${remainingItems.length})`}
            </h2>
          </header>
          <div className="space-y-3">
            {remainingItems.map((item) => (
              <InteractionCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {noteGroups.length ? (
        <section id="usage-notes" className="space-y-5 scroll-mt-6" aria-labelledby="usage-notes-title">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Lưu ý kèm theo</p>
            <h2 id="usage-notes-title" className="mt-1 font-heading text-lg font-bold text-foreground sm:text-xl">
              Khi dùng các thuốc đã chọn
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-secondary">
              Đây là các lưu ý có tài liệu nguồn về thực phẩm, đồ uống hoặc sản phẩm bổ sung.
            </p>
          </header>

          {noteGroups.map(({ id, title, icon: Icon, items }) => (
            <section key={id} className="space-y-3" aria-labelledby={id}>
              <h3 id={id} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.9} aria-hidden />
                {title}
                <span className="font-normal text-foreground-muted">({items.length})</span>
              </h3>

              <div className="space-y-3">
                {items.map((item) => (
                  <UsageNoteCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : null}

      <p className="border-t border-border/70 pt-4 text-[11px] leading-5 text-foreground-muted">
        Kết quả mang tính tham khảo, không thay thế đánh giá của bác sĩ hoặc dược sĩ.
      </p>
    </section>
  );
}
