import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { isRejectedForPatient } from "./review-status";
import ReviewStatusTag from "./ReviewStatusTag";
import SeverityBadge from "./SeverityBadge";

const KIND_LABEL: Record<TInteractionKind, string> = {
  "drug-drug": "Thuốc–thuốc",
  "drug-food": "Thuốc–thực phẩm",
};

export default function InteractionTableRow({
  interaction,
}: {
  interaction: IInteractionItem;
}) {
  // Cùng luật với InteractionCard: không có trích dẫn thì không dựng dòng cảnh báo,
  // và cảnh báo đã bị dược sĩ bác bỏ không được hiển thị cho bệnh nhân (ADR 0005).
  if (!interaction.citations?.length) return null;
  if (isRejectedForPatient(interaction.reviewStatus)) return null;

  return (
    <tr className="border-b border-border text-sm last:border-0">
      <td className="px-3 py-2 text-foreground">
        <Link
          href={`${ROUTES.INTERACTIONS}/${interaction.id}`}
          className="hover:text-primary"
        >
          {interaction.subject} × {interaction.object}
        </Link>
      </td>
      <td className="px-3 py-2 text-foreground-secondary">
        {KIND_LABEL[interaction.kind]}
      </td>
      <td className="px-3 py-2">
        <SeverityBadge severity={interaction.severity} />
      </td>
      <td className="px-3 py-2">
        <ReviewStatusTag status={interaction.reviewStatus} />
      </td>
      <td className="px-3 py-2 text-foreground-muted">
        {interaction.citations.length} trích dẫn
      </td>
    </tr>
  );
}
