import { CheckCircle2, Clock, XCircle } from "lucide-react";

const CONFIG: Record<TReviewStatus, { label: string; className: string; Icon: typeof Clock }> = {
  pending: {
    label: "Đang chờ xác nhận chuyên môn",
    className: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    Icon: Clock,
  },
  approved: {
    label: "Dược sĩ Vinmec đã xác nhận",
    className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Dược sĩ đã bác bỏ",
    className: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
    Icon: XCircle,
  },
};

export default function ReviewStatusTag({ status }: { status: TReviewStatus }) {
  const { label, className, Icon } = CONFIG[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
