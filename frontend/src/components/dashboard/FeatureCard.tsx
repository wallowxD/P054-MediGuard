import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Chưa nối chức năng thật — vẫn dẫn tới trang trạng thái "Chưa hỗ trợ", không phải link chết */
  unsupported?: boolean;
}

export default function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  unsupported,
}: FeatureCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hero-tint text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        {unsupported ? (
          <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground-secondary">
            Chưa hỗ trợ
          </span>
        ) : null}
      </div>
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-foreground-secondary">{description}</p>
    </Link>
  );
}
