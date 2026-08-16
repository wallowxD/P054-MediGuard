import Image from "next/image";
import { VINMEC_ABOUT_PARTNERS } from "./vinmec-about-content";

export default function VinmecAboutPartners() {
  const marqueeItems = [...VINMEC_ABOUT_PARTNERS, ...VINMEC_ABOUT_PARTNERS];

  return (
    <section className="w-full overflow-hidden py-12 sm:py-16" aria-label="Đối tác chiến lược">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-8 text-center max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hợp tác quốc tế</p>
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Mạng lưới đối tác học thuật & công nghệ toàn cầu
        </h2>
      </div>

      {/* Marquee full-width với mask gradient ở 2 bên mép */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee-infinite flex items-center gap-8 sm:gap-12 py-3">
          {marqueeItems.map((partner, idx) => (
            <div
              key={`${partner.src}-${idx}`}
              className="flex shrink-0 items-center justify-center px-4 sm:px-6 transition-transform duration-300 hover:scale-110"
            >
              <Image
                src={partner.src}
                alt={partner.alt}
                width={180}
                height={60}
                className="h-8 sm:h-10 w-auto object-contain dark:brightness-0 dark:invert"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
