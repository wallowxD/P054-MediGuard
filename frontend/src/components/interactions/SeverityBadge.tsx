const SEVERITY_LABEL: Record<TSeverity, string> = {
  contraindicated: "Chống chỉ định",
  major: "Nghiêm trọng",
  moderate: "Trung bình",
  minor: "Nhẹ",
  unknown: "Chưa rõ",
};

const SEVERITY_DOT: Record<TSeverity, string> = {
  contraindicated: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
  major: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]",
  moderate: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  minor: "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]",
  unknown: "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.6)]",
};

const SEVERITY_STYLE: Record<TSeverity, string> = {
  contraindicated:
    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  major:
    "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  moderate:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  minor:
    "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  unknown:
    "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export default function SeverityBadge({ severity }: { severity: TSeverity }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md transition-all ${SEVERITY_STYLE[severity]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[severity]}`} aria-hidden />
      <span>{SEVERITY_LABEL[severity]}</span>
    </span>
  );
}
