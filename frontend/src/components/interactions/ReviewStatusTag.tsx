import { CheckCircle2, Clock, XCircle } from "lucide-react";

/**
 * Human-in-the-loop KHÔNG chặn luồng: cảnh báo `pending` vẫn hiển thị đầy đủ cho
 * người dùng, chỉ kèm nhãn "chờ xác nhận chuyên môn". Đừng ẩn cảnh báo chờ duyệt.
 */
const CONFIG: Record<TReviewStatus, { label: string; className: string; Icon: typeof Clock }> = {
  pending: {
    label: "Chờ xác nhận chuyên môn",
    className: "text-warning",
    Icon: Clock,
  },
  approved: {
    label: "Dược sĩ đã xác nhận",
    className: "text-success",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Dược sĩ đã bác bỏ",
    className: "text-error",
    Icon: XCircle,
  },
};

export default function ReviewStatusTag({ status }: { status: TReviewStatus }) {
  const { label, className, Icon } = CONFIG[status];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
