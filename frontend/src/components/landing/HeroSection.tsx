import { ArrowRight } from "lucide-react";
import { Roboto } from "next/font/google";
import Button from "@/components/ui/Button";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import Reveal from "./Reveal";

/**
 * Scoped to this component only (via `.variable`, not the root layout), so the
 * rest of the site keeps `font-heading` (Lora) untouched — only the hero
 * headline uses Roboto.
 */
const heroDisplayFont = Roboto({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-hero-display",
});

// `id` của section là neo cho mục nav "Trang chủ" và là section đầu tiên scroll spy dò.
export default function HeroSection() {
  return (
    <section
      id={LANDING_SECTIONS.HOME.slice(1)}
      className={`relative overflow-hidden scroll-mt-20 ${heroDisplayFont.variable}`}
    >
      <div aria-hidden className="landing-hero-gradient absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="landing-hero-texture pointer-events-none absolute -top-6 -right-10 hidden h-56 w-56 opacity-40 sm:block"
      />
      <div
        aria-hidden
        className="landing-hero-texture pointer-events-none absolute -bottom-10 -left-14 hidden h-64 w-64 opacity-30 sm:block"
      />

      {/* `landing-hero-viewport` giữ min-height của hero ở lg (xem globals.css) và phải
          ở cùng element với `lg:items-center` để nội dung căn giữa đáng tin cậy. */}
      <div className="landing-wide-container landing-hero-viewport grid gap-12 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:grid-cols-[minmax(0,38rem)_1fr] lg:items-center lg:gap-[clamp(3rem,6vw,7.5rem)] lg:py-12">
        {/* The illustration column is capped to the image's own size (not a flexible
            fraction) so it doesn't leave a wide dead zone next to a fixed-size image
            as the container grows — the remaining width goes to the text column. */}
        {/* Left zone — pill render bleeds over the background, no cropping box.
            The asset itself is already a diagonal composition, so it isn't rotated again here.
            Capped at a real pixel size (not a % of the column) so it keeps visual weight
            instead of floating small inside a now much wider column. */}
        <Reveal className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
          <img
            src="/pill-render.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="landing-hero-figure landing-pill-shadow mx-auto w-full max-w-[22rem] select-none sm:max-w-sm lg:mx-0 lg:w-auto lg:max-w-[min(100%,38rem)]"
          />
        </Reveal>

        {/* Right zone — headline, subtext, CTA. */}
        <Reveal delay="short" className="max-w-xl lg:justify-self-start">
          <h1
            style={{
              fontFamily: "var(--font-hero-display)",
              fontSize: "clamp(2rem, 1.3rem + 3vw, 3rem)",
            }}
            className="font-semibold leading-[1.12] tracking-tight text-foreground"
          >
            Hiểu rõ hơn về thuốc
            <br /> bạn đang sử dụng
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-foreground-secondary">
            Tra cứu tương tác thuốc và thực phẩm, kèm trích dẫn nguồn để bạn đối chiếu.
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button href={ROUTES.SIGNIN} variant="accent">
              Tra cứu thuốc ngay
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button href={ROUTES.SIGNUP} variant="outline">
              Đăng ký
            </Button>
          </div>

          <p className="mt-4 max-w-md text-sm text-foreground-secondary">
            Chỉ mang tính tham khảo, không thay thế tư vấn của bác sĩ hoặc dược sĩ.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
