import CitationBlock from "./CitationBlock";
import PendingReviewNotice from "./PendingReviewNotice";
import { isRejectedForPatient } from "./review-status";
import ReviewStatusTag from "./ReviewStatusTag";
import SeverityBadge from "./SeverityBadge";

/**
 * ★ Chốt chặn cuối của hai luật an toàn ở tầng UI.
 *
 * 1. Không có citation → KHÔNG render cảnh báo (ADR 0006). Trả về null thay vì hiển
 *    thị một cảnh báo trần trụi, vì cảnh báo không nguồn còn tệ hơn không có cảnh báo.
 * 2. `rejected` → KHÔNG render cho patient client (ADR 0005). Backend chịu trách nhiệm
 *    không trả bản ghi đã bị bác bỏ, nhưng UI không dựa vào đó: một lỗi filter phía
 *    backend không được biến thành cảnh báo dược sĩ đã bác bỏ hiển thị trên màn bệnh nhân.
 *
 * Tầng gọi chịu trách nhiệm đếm và báo "chưa có dữ liệu" cho người dùng.
 */
export default function InteractionCard({ interaction }: { interaction: IInteractionItem }) {
  if (!interaction.citations?.length) return null;
  if (isRejectedForPatient(interaction.reviewStatus)) return null;

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

      {interaction.reviewStatus === "pending" ? (
        <div className="mt-3">
          <PendingReviewNotice />
        </div>
      ) : null}

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
        {/* Nhãn cũ "Xử trí" đọc như chỉ định điều trị cho chính người dùng. Đây là nội
            dung chép lại từ tài liệu nguồn, không phải hướng xử trí cho ca cụ thể. */}
        {interaction.management ? (
          <div>
            <dt className="inline font-medium text-foreground-secondary">
              Nội dung trong tài liệu nguồn:{" "}
            </dt>
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
