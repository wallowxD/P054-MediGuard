import { ChevronDown, ExternalLink, FileText } from "lucide-react";

export default function CitationBlock({
  citation,
  label = "Xem trích dẫn & tài liệu nguồn",
}: {
  citation: ICitation;
  label?: string;
}) {
  return (
    <details className="group rounded-2xl liquid-glass-subtle transition-all">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-xs font-semibold text-foreground-secondary transition-colors hover:text-foreground focus-visible:outline-none">
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" aria-hidden />
          <span>{label}</span>
        </span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 text-foreground-muted" aria-hidden />
      </summary>
      <figure className="border-t border-border/60 px-4 py-3 text-xs">
        <blockquote className="italic leading-relaxed text-foreground-secondary border-l-2 border-primary/40 pl-3">
          “{citation.quote}”
        </blockquote>
        <figcaption className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
          <a
            href={citation.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <span>Tờ hướng dẫn sử dụng gốc</span>
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <span>• {citation.source}</span>
          {citation.page ? <span>• Trang {citation.page}</span> : null}
          {citation.section ? <span>• Mục {citation.section}</span> : null}
        </figcaption>
      </figure>
    </details>
  );
}
