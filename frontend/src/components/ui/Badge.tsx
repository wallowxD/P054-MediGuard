import type { ReactNode } from "react";

type BadgeTone = "primary" | "success" | "warning" | "severity" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  severity: "border-severity-contraindicated bg-severity-contraindicated/10 text-severity-contraindicated",
  neutral: "border-border bg-surface text-foreground-secondary",
};

/** Pill nhỏ dùng cho eyebrow, chip thuốc, badge mức độ nghiêm trọng — dùng chung 1 kiểu bo góc/viền. */
export default function Badge({
  tone = "primary",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
