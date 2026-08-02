import { ExternalLink } from "lucide-react";

/**
 * ★ LUẬT SỐ 1 CỦA DỰ ÁN: không bịa cảnh báo.
 *
 * `quote` phải render NGUYÊN VĂN từ tờ HDSD — không tóm tắt, không diễn giải lại,
 * không cắt bớt bằng CSS line-clamp. Không có citation thì KHÔNG được hiển thị
 * cảnh báo (xem InteractionCard).
 */
export default function CitationBlock({ citation }: { citation: ICitation }) {
  return (
    <figure className="rounded-lg border-l-2 border-border bg-surface px-3 py-2">
      <blockquote className="text-sm italic text-foreground-secondary">
        “{citation.quote}”
      </blockquote>
      <figcaption className="mt-1.5 text-xs text-foreground-muted">
        {citation.sourceUrl ? (
          <a
            href={citation.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            {citation.source}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : (
          citation.source
        )}
        {citation.page ? ` — tr. ${citation.page}` : null}
      </figcaption>
    </figure>
  );
}
