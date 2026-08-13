import { AlertCircle, Brain, CheckCircle2, ChevronDown, Info, Sparkles, Utensils, Wheat } from "lucide-react";
import CitationBlock from "./CitationBlock";
import ReviewStatusTag from "./ReviewStatusTag";
import SeverityBadge from "./SeverityBadge";
import { useChat } from "@/context/ChatContext";
import Button from "@/components/ui/Button";

const BAR_CLASS: Record<TSeverity, string> = {
  contraindicated: "bg-severity-contraindicated",
  major: "bg-severity-major",
  moderate: "bg-severity-moderate",
  minor: "bg-severity-minor",
  unknown: "bg-severity-unknown",
};

function Detail({ item }: { item: IInteractionItem }) {
  return (
    <details className="group border-b border-border last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5">
        <div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-foreground">{item.subject} + {item.object}</span><SeverityBadge severity={item.severity} /></div><div className="mt-1"><ReviewStatusTag status={item.reviewStatus} /></div></div>
        <ChevronDown className="h-5 w-5 shrink-0 text-foreground-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-5 px-4 pb-5 text-sm sm:grid-cols-2 sm:px-5">
        <div className="space-y-2"><h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Cơ chế / hậu quả</h4>{item.mechanism ? <p className="text-foreground-secondary">{item.mechanism}</p> : null}{item.consequence || item.effectDescription ? <p className="text-foreground-secondary">{item.consequence ?? item.effectDescription}</p> : null}</div>
        <div className="space-y-2"><h4 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">Khuyến nghị trong nguồn</h4><p className="text-foreground-secondary">{item.management || "Nguồn không ghi hướng xử trí riêng."}</p></div>
        <div className="space-y-2 sm:col-span-2">{item.citations.map((citation) => <CitationBlock key={citation.evidenceId} citation={citation} />)}</div>
      </div>
    </details>
  );
}

export default function UnifiedInteractionResults({ result }: { result: IInteractionCheckResponse }) {
  const { openChatWithResult } = useChat();
  const highlight = result.items.find((item) => item.id === result.highlightId);
  const diseaseItems = result.items.filter((item) => item.kind === "drug-disease");
  const foodNotes = result.notes.filter((item) => item.kind === "drug-food");
  const supplementNotes = result.notes.filter((item) => item.kind === "drug-supplement");
  return (
    <section className="space-y-6" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-hero-tint-soft p-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-foreground sm:text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Trợ lý AI phân tích lượt tra cứu
          </h3>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-0.5">
            Gửi toàn bộ ngữ cảnh tra cứu này cho AI để được giải thích chi tiết hoặc hỏi đáp thắc mắc.
          </p>
        </div>
        <Button
          size="md"
          onClick={() => openChatWithResult(result)}
          className="flex items-center gap-2 font-semibold shadow-md transition-all hover:scale-[1.02]"
        >
          <Sparkles className="h-4 w-4" />
          Hỏi thêm AI
        </Button>
      </div>

      {result.historyStatus === "not-saved" ? <div className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-foreground-secondary"><Info className="h-5 w-5 shrink-0 text-warning" />Kết quả vẫn dùng được nhưng chưa lưu vào lịch sử. Hãy lưu hoặc chụp lại thông tin cần thiết.</div> : null}
      <div className="grid overflow-hidden rounded-xl sm:grid-cols-5" aria-label="Thang mức độ nghiêm trọng">
        {result.severityScale.map((item) => <div key={item.severity} className={`${BAR_CLASS[item.severity]} flex min-h-12 items-center justify-center gap-2 px-2 py-2 text-center text-xs font-semibold text-white`}><AlertCircle className="h-4 w-4" aria-hidden />{item.label} ({item.resultCount})</div>)}
      </div>
      {highlight ? <>
        <article className="rounded-2xl border border-severity-major/40 bg-severity-major/5 p-5 sm:p-7"><header className="flex flex-wrap items-center gap-3"><AlertCircle className="h-7 w-7 text-severity-major" aria-hidden /><h2 className="text-lg font-bold text-foreground sm:text-xl">{highlight.subject} + {highlight.object}</h2><SeverityBadge severity={highlight.severity} /></header><p className="mt-4 text-base leading-7 text-foreground-secondary"><strong className="text-error">Cảnh báo: </strong>{highlight.aiSummary.warning}</p><div className="mt-3"><ReviewStatusTag status={highlight.reviewStatus} /></div><div className="mt-4 space-y-2">{highlight.citations.map((citation) => <CitationBlock key={citation.evidenceId} citation={citation} label="Xem trích dẫn của cảnh báo" />)}</div></article>
        <article className="rounded-2xl border border-primary/20 bg-hero-tint-soft p-5 sm:p-7"><h2 className="flex items-center gap-2 text-lg font-bold text-primary"><Brain className="h-5 w-5" aria-hidden />Gợi ý cân nhắc & hướng xử trí</h2>{highlight.aiSummary.managementBullets.length ? <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground-secondary">{highlight.aiSummary.managementBullets.map((value, index) => <li key={index}>{value}</li>)}</ul> : <p className="mt-3 text-sm text-foreground-secondary">Nguồn không ghi hướng xử trí riêng; hãy trao đổi với bác sĩ hoặc dược sĩ nếu cần dùng cùng lúc.</p>}<p className="mt-4 text-xs italic text-foreground-muted">Quyết định cuối cùng do bác sĩ điều trị đánh giá trên tình trạng lâm sàng cụ thể.</p>{highlight.aiSummary.status === "fallback" ? <p className="mt-2 text-xs text-warning">AI chưa thể diễn giải; đang hiển thị trực tiếp nội dung đã xác thực từ cơ sở dữ liệu.</p> : null}<div className="mt-4 space-y-2">{highlight.citations.map((citation) => <CitationBlock key={citation.evidenceId} citation={citation} label="Xem nguồn của hướng xử trí" />)}</div></article>
      </> : <div className="rounded-2xl border border-success/30 bg-success/5 p-5"><div className="flex items-center gap-2 font-semibold text-foreground"><CheckCircle2 className="h-5 w-5 text-success" />Chưa phát hiện tương tác có đủ bằng chứng</div><p className="mt-2 text-sm text-foreground-secondary">Kết quả này không khẳng định phối hợp thuốc là an toàn. Hãy hỏi bác sĩ hoặc dược sĩ nếu bạn còn lo ngại.</p></div>}
      {result.items.length ? <div><h2 className="mb-3 text-lg font-bold text-foreground">Danh sách tương tác phát hiện ({result.items.length})</h2><div className="overflow-hidden rounded-2xl border border-border bg-card">{result.items.map((item) => <Detail key={item.id} item={item} />)}</div></div> : null}
      {(foodNotes.length || diseaseItems.length || supplementNotes.length) ? <div><h2 className="mb-3 text-lg font-bold text-foreground">Lưu ý khi sử dụng các thuốc đã chọn</h2><div className="grid gap-4 lg:grid-cols-3">{[
        { title: "Thực phẩm & đồ uống", icon: Utensils, values: foodNotes },
        { title: "Bệnh nền đã xác nhận", icon: AlertCircle, values: diseaseItems },
        { title: "Thực phẩm bổ sung", icon: Wheat, values: supplementNotes },
      ].map(({ title, icon: Icon, values }) => <section key={title} className="rounded-2xl border border-border bg-card p-4"><h3 className="flex items-center gap-2 font-semibold text-foreground"><Icon className="h-4 w-4 text-primary" />{title}</h3>{values.length ? <div className="mt-3 divide-y divide-border">{values.map((item) => <article key={item.id} className="py-3 first:pt-0 last:pb-0"><h4 className="text-sm font-semibold text-foreground">{item.subject} + {item.object}</h4><p className="mt-1.5 text-sm leading-6 text-foreground-secondary">{item.effectDescription ?? item.consequence ?? item.aiSummary.warning}</p>{item.management ? <p className="mt-2 text-sm leading-6 text-foreground-secondary"><span className="font-medium text-foreground">Cách xử trí trong nguồn: </span>{item.management}</p> : null}<div className="mt-3 space-y-2">{item.citations.map((citation) => <CitationBlock key={citation.evidenceId} citation={citation} label="Xem nguồn" />)}</div></article>)}</div> : <p className="mt-3 text-sm text-foreground-muted">Không có ghi chú đủ nguồn.</p>}</section>)}</div></div> : null}
    </section>
  );
}
