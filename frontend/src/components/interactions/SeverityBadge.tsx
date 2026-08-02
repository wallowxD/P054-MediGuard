const SEVERITY_LABEL: Record<TSeverity, string> = {
  contraindicated: "Chống chỉ định",
  major: "Nghiêm trọng",
  moderate: "Trung bình",
  minor: "Nhẹ",
  unknown: "Chưa rõ",
};

const SEVERITY_CLASS: Record<TSeverity, string> = {
  contraindicated: "border-severity-contraindicated text-severity-contraindicated",
  major: "border-severity-major text-severity-major",
  moderate: "border-severity-moderate text-severity-moderate",
  minor: "border-severity-minor text-severity-minor",
  unknown: "border-severity-unknown text-severity-unknown",
};

/** Mức nghiêm trọng do backend `domain/severity.py` xếp — FE chỉ tô màu, không tự suy ra. */
export default function SeverityBadge({ severity }: { severity: TSeverity }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${SEVERITY_CLASS[severity]}`}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}
