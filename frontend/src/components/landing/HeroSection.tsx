import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import HeroVisual from "./HeroVisual";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Nền chuyển sắc nhẹ, giữ cảm giác "y tế" mà không chói */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/8 via-background to-background"
      />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:py-28">
        <div>
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Cảnh báo an toàn tham khảo — có nguồn
          </span>

          <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            Hiểu rõ hơn về thuốc
            <br className="hidden sm:block" /> bạn đang sử dụng
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
            Tra cứu tương tác thuốc–thuốc, thuốc–thực phẩm và xem thông tin thuốc theo
            cách dễ hiểu, có nguồn để đối chiếu.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={ROUTES.SIGNIN}
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Bắt đầu tra cứu
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <a
              href={LANDING_SECTIONS.HOW_IT_WORKS}
              className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Xem cách hoạt động
            </a>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
