import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "solid" | "outline" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid:
    "landing-primary-shadow bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary-hover active:translate-y-0 active:scale-[0.98]",
  outline: "border border-border text-foreground hover:border-primary hover:text-primary",
  ghost: "text-foreground-secondary hover:text-primary",
  // Reserved for the hero CTA only — see docs/frontend.md's cta-accent rule.
  accent:
    "landing-cta-shadow bg-[var(--cta-accent)] text-white hover:-translate-y-0.5 hover:bg-[var(--cta-accent-hover)] active:translate-y-0 active:scale-[0.98]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm font-medium",
  md: "px-6 py-3 text-sm font-semibold",
  lg: "px-8 py-4 text-base font-semibold",
};

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className">;

/** Nút dùng chung cho toàn bộ landing page — render <Link> nếu có `href`, ngược lại <button>. */
export default function Button({
  variant = "solid",
  size = "md",
  href,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
