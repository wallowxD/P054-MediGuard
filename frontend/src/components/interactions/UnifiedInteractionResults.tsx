"use client";

import { AlertCircle, AlertTriangle, Brain, CheckCircle2, ChevronDown, Info, ShieldAlert, Sparkles, Utensils, Wheat } from "lucide-react";
import { useEffect } from "react";
import CitationBlock from "./CitationBlock";
import ReviewStatusTag from "./ReviewStatusTag";
import SeverityBadge from "./SeverityBadge";
import { useChat } from "@/context/ChatContext";

const BAR_CLASS: Record<TSeverity, string> = {
  contraindicated: "bg-red-500 text-white",
  major: "bg-orange-500 text-white",
  moderate: "bg-amber-500 text-white",
  minor: "bg-sky-500 text-white",
  unknown: "bg-slate-500 text-white",
};

function Detail({ item }: { item: IInteractionItem }) {
  return (
    <details className="group border-b border-border/60 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 focus-visible:outline-none transition-colors hover:bg-surface/50">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-heading text-sm font-bold text-foreground">{item.subject} + {item.object}</span>
            <SeverityBadge severity={item.severity} />
          </div>
          <div className="mt-1.5"><ReviewStatusTag status={item.reviewStatus} /></div>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-foreground-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-4 px-5 pb-5 text-xs sm:grid-cols-2">
        <div className="space-y-1.5 rounded-2xl liquid-glass-subtle p-3.5">
          <h4 className="font-bold uppercase tracking-wider text-primary text-[10px]">Cơ chế & tác động</h4>
          {item.mechanism ? <p className="text-foreground-secondary leading-relaxed">{item.mechanism}</p> : null}
          {item.consequence || item.effectDescription ? (
            <p className="text-foreground-secondary leading-relaxed">{item.consequence ?? item.effectDescription}</p>
          ) : null}
        </div>
        <div className="space-y-1.5 rounded-2xl liquid-glass-subtle p-3.5">
          <h4 className="font-bold uppercase tracking-wider text-primary text-[10px]">Khuyến nghị trong nguồn</h4>
          <p className="text-foreground-secondary leading-relaxed">{item.management || "Nguồn không ghi hướng xử trí riêng."}</p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          {item.citations.map((citation) => (
            <CitationBlock key={citation.evidenceId} citation={citation} />
          ))}
        </div>
      </div>
    </details>
  );
}

export default function UnifiedInteractionResults({ result }: { result: IInteractionCheckResponse }) {
  const { registerResult } = useChat();

  useEffect(() => registerResult(result), [result, registerResult]);
  const highlight = result.items.find((item) => item.id === result.highlightId);
  const diseaseItems = result.items.filter((item) => item.kind === "drug-disease");
  const foodNotes = result.notes.filter((item) => item.kind === "drug-food");
  const supplementNotes = result.notes.filter((item) => item.kind === "drug-supplement");

  return (
    <section className="space-y-6" aria-live="polite">
      {result.historyStatus === "not-saved" ? (
        <div className="flex items-center gap-2.5 rounded-2xl liquid-glass-subtle p-3.5 text-xs text-foreground-secondary border border-amber-500/30">
          <Info className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Kết quả hiển thị đầy đủ nhưng chưa lưu vào lịch sử tài khoản.</span>
        </div>
      ) : null}

      {/* Apple Health Severity Bar Segment */}
      <div className="grid overflow-hidden rounded-2xl border border-border/80 sm:grid-cols-5 shadow-sm" aria-label="Thang mức độ nguy cơ">
        {result.severityScale.map((item) => (
          <div
            key={item.severity}
            className={`${BAR_CLASS[item.severity]} flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 text-center text-xs font-semibold`}
          >
            <AlertCircle className="h-3.5 w-3.5" aria-hidden />
            <span>{item.label} ({item.resultCount})</span>
          </div>
        ))}
      </div>

      {/* Main Highlight Card */}
      {highlight ? (
        <div className="space-y-4">
          <article className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8 border-l-4 border-l-amber-500 shadow-xl">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">
                    {highlight.subject} + {highlight.object}
                  </h2>
                  <div className="mt-1"><ReviewStatusTag status={highlight.reviewStatus} /></div>
                </div>
              </div>
              <SeverityBadge severity={highlight.severity} />
            </header>

            <div className="mt-4 rounded-2xl liquid-glass-subtle p-4">
              <p className="text-xs sm:text-sm leading-relaxed text-foreground">
                <strong className="text-red-500 font-bold">Cảnh báo: </strong>
                {highlight.aiSummary.warning}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {highlight.citations.map((citation) => (
                <CitationBlock key={citation.evidenceId} citation={citation} label="Xem trích dẫn của cảnh báo" />
              ))}
            </div>
          </article>

          {/* AI Management Advice Card */}
          <article className="rounded-3xl liquid-glass p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-heading text-base font-bold text-primary">
              <Brain className="h-5 w-5" />
              Gợi ý cân nhắc & hướng xử trí
            </h2>
            {highlight.aiSummary.managementBullets.length ? (
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-foreground-secondary">
                {highlight.aiSummary.managementBullets.map((value, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-foreground-secondary">
                Nguồn không ghi hướng xử trí riêng; hãy trao đổi với bác sĩ hoặc dược sĩ nếu cần dùng đồng thời.
              </p>
            )}
            <p className="mt-4 text-[11px] italic text-foreground-muted">
              Quyết định cuối cùng do bác sĩ điều trị đánh giá trên tình trạng lâm sàng cụ thể.
            </p>
            <div className="mt-4 space-y-2">
              {highlight.citations.map((citation) => (
                <CitationBlock key={citation.evidenceId} citation={citation} label="Xem nguồn của hướng xử trí" />
              ))}
            </div>
          </article>
        </div>
      ) : (
        <div className="rounded-3xl liquid-glass p-6 sm:p-8 text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="font-heading text-base font-bold text-foreground">
            Chưa phát hiện tương tác có đủ bằng chứng
          </h3>
          <p className="text-xs text-foreground-secondary max-w-md mx-auto">
            Hệ thống không tìm thấy cảnh báo tương tác nào cho các thuốc và bệnh nền đã chọn trong cơ sở dữ liệu.
          </p>
        </div>
      )}

      {/* Full Interaction List */}
      {result.items.length ? (
        <div className="space-y-3">
          <h2 className="font-heading text-base font-bold text-foreground px-1">
            Danh sách tương tác phát hiện ({result.items.length})
          </h2>
          <div className="overflow-hidden rounded-3xl liquid-glass shadow-md">
            {result.items.map((item) => (
              <Detail key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Special Notes Bento Grid */}
      {(foodNotes.length || diseaseItems.length || supplementNotes.length) ? (
        <div className="space-y-3">
          <h2 className="font-heading text-base font-bold text-foreground px-1">
            Lưu ý khi sử dụng các thuốc đã chọn
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              { title: "Thực phẩm & Đồ uống", icon: Utensils, values: foodNotes },
              { title: "Bệnh nền đã chọn", icon: AlertCircle, values: diseaseItems },
              { title: "Thực phẩm bổ sung", icon: Wheat, values: supplementNotes },
            ].map(({ title, icon: Icon, values }) => (
              <section key={title} className="rounded-3xl liquid-glass p-5 space-y-3">
                <h3 className="flex items-center gap-2 font-heading text-xs font-bold text-foreground uppercase tracking-wider">
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{title}</span>
                </h3>
                {values.length ? (
                  <div className="space-y-3 divide-y divide-border/60">
                    {values.map((item) => (
                      <article key={item.id} className="pt-3 first:pt-0 space-y-1.5">
                        <h4 className="text-xs font-bold text-foreground">{item.subject} + {item.object}</h4>
                        <p className="text-xs leading-relaxed text-foreground-secondary">
                          {item.effectDescription ?? item.consequence ?? item.aiSummary.warning}
                        </p>
                        {item.management ? (
                          <p className="text-[11px] text-foreground-secondary">
                            <span className="font-semibold text-foreground">Cách xử trí: </span>
                            {item.management}
                          </p>
                        ) : null}
                        <div className="pt-1">
                          {item.citations.map((citation) => (
                            <CitationBlock key={citation.evidenceId} citation={citation} label="Xem nguồn" />
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-foreground-muted">Không có ghi chú nào cho danh mục này.</p>
                )}
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
