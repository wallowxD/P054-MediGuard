"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

const DELAY_CLASSES = {
  none: "delay-0",
  short: "delay-100",
  medium: "delay-200",
} as const;

export default function Reveal({
  children,
  className = "",
  delay = "none",
}: {
  children: ReactNode;
  className?: string;
  delay?: keyof typeof DELAY_CLASSES;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const frame = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.unobserve(element);
      },
      { rootMargin: "0px 0px -8%", threshold: 0.12 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`${className} landing-reveal transform-gpu transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transform-none motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${DELAY_CLASSES[delay]}`}
    >
      {children}
    </div>
  );
}
