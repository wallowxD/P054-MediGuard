import CitationBlock from "./CitationBlock";
import ReviewStatusTag from "./ReviewStatusTag";
import SeverityBadge from "./SeverityBadge";

/**
 * ★ Chốt chặn cuối của luật "không bịa cảnh báo" ở tầng UI.
 *
 * Không có citation → KHÔNG render cảnh báo. Trả về null thay vì hiển thị một
 * cảnh báo trần trụi, vì cảnh báo không nguồn còn tệ hơn không có cảnh báo.
 * Tầng gọi chịu trách nhiệm đếm và báo "chưa có dữ liệu" cho người dùng.
 */
export default function InteractionCard({ interaction }: { interaction: IInteractionItem }) {
  if (!interaction.citations?.length) return null;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-medium text-foreground">
          {interaction.subject} <span className="text-foreground-muted">×</span>{" "}
          {interaction.object}
        </h3>
        <SeverityBadge severity={interaction.severity} />
      </header>

      <div className="mt-1">
        <ReviewStatusTag status={interaction.reviewStatus} />
      </div>

      <dl className="mt-3 space-y-1.5 text-sm">
        {interaction.mechanism ? (
          <div>
            <dt className="inline font-medium text-foreground-secondary">Cơ chế: </dt>
            <dd className="inline text-foreground-secondary">{interaction.mechanism}</dd>
          </div>
        ) : null}
        {interaction.consequence ? (
          <div>
            <dt className="inline font-medium text-foreground-secondary">Hậu quả: </dt>
            <dd className="inline text-foreground-secondary">{interaction.consequence}</dd>
          </div>
        ) : null}
        {interaction.management ? (
          <div>
            <dt className="inline font-medium text-foreground-secondary">Xử trí: </dt>
            <dd className="inline text-foreground-secondary">{interaction.management}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-3 space-y-2">
        {interaction.citations.map((citation, i) => (
          <CitationBlock key={i} citation={citation} />
        ))}
      </div>
    </article>
  );
}
