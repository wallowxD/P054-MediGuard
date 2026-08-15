import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

interface FeatureCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
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
      className="group relative flex flex-col justify-between rounded-3xl liquid-glass p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
            <Icon className="h-6 w-6" />
          </div>
          {unsupported ? (
            <span className="rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-foreground-muted">
              Sắp ra mắt
            </span>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full liquid-glass-pill text-foreground-muted opacity-60 transition-all group-hover:opacity-100 group-hover:text-primary group-hover:scale-105">
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </div>

        <h3 className="font-heading text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm leading-relaxed text-foreground-secondary">
          {description}
        </p>
      </div>
    </Link>
  );
}
