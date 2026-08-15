import type { ReactNode } from "react";

type BadgeTone = "primary" | "success" | "warning" | "error" | "severity" | "neutral" | "glass";

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary:
    "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/15",
  success:
    "border-success/20 bg-success/10 text-success dark:border-success/30 dark:bg-success/15",
  warning:
    "border-warning/20 bg-warning/10 text-warning dark:border-warning/30 dark:bg-warning/15",
  error:
    "border-error/20 bg-error/10 text-error dark:border-error/30 dark:bg-error/15",
  severity:
    "border-severity-contraindicated/30 bg-severity-contraindicated/10 text-severity-contraindicated",
  neutral:
    "border-border/80 bg-surface text-foreground-secondary",
  glass:
    "liquid-glass-pill text-foreground-secondary hover:text-foreground",
};

/** Pill nhỏ phong cách Apple Liquid Glass cho trạng thái, phân loại, chip thuốc. */
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md transition-all ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
