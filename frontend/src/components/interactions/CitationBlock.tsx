import { ChevronDown, ExternalLink, FileText } from "lucide-react";

/** Citation luôn giữ nguyên văn nhưng chỉ mở khi người dùng cần đối chiếu. */
export default function CitationBlock({
  citation,
  label = "Xem nguồn và trích dẫn",
}: {
  citation: ICitation;
  label?: string;
}) {
  return (
    <details className="group rounded-lg border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-primary" aria-hidden />
          {label}
        </span>
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <figure className="border-t border-border px-3 py-3">
        <blockquote className="text-sm italic leading-6 text-foreground-secondary">
          “{citation.quote}”
        </blockquote>
        <figcaption className="mt-2 text-xs text-foreground-muted">
          <a
            href={citation.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            Mở tờ hướng dẫn sử dụng gốc
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <span className="ml-1">· {citation.source}</span>
          {citation.page ? ` · tr. ${citation.page}` : null}
          {citation.section ? ` · ${citation.section}` : null}
        </figcaption>
      </figure>
    </details>
  );
}
