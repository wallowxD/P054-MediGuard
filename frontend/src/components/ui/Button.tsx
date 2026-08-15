import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ButtonVariant = "solid" | "glass" | "outline" | "ghost" | "accent";
type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  solid:
    "bg-gradient-to-b from-[#0077ed] to-[#0066cc] text-white shadow-[0_4px_14px_rgba(0,102,204,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-105 hover:shadow-[0_6px_20px_rgba(0,102,204,0.45)] active:scale-[0.98] border border-white/20",
  glass:
    "liquid-glass-button text-foreground hover:text-primary active:scale-[0.98]",
  outline:
    "border border-border/80 bg-background/50 backdrop-blur-md text-foreground hover:border-primary hover:text-primary hover:bg-surface active:scale-[0.98]",
  ghost:
    "text-foreground-secondary hover:text-foreground hover:bg-surface/80 active:scale-[0.98]",
  accent:
    "bg-gradient-to-b from-[#10b981] to-[#059669] text-white shadow-[0_4px_14px_rgba(16,185,129,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:brightness-105 hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] active:scale-[0.98] border border-white/20",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-xs font-medium",
  md: "px-5 py-2.5 text-sm font-semibold",
  lg: "px-7 py-3.5 text-base font-semibold",
};

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<"button">, "className">;

/** Nút Liquid Glass phong cách Apple Tech-Health — render <Link> nếu có `href`, ngược lại <button>. */
export default function Button({
  variant = "solid",
  size = "md",
  href,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-sans transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`;

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
