import Image from "next/image";
import { VINMEC_PARTNERS } from "./vinmec-content";

export default function VinmecPartners() {
  // Nhân đôi mảng để animation marquee chạy vòng lặp vô tận liền mạch (0% -> -50%)
  const marqueeItems = [...VINMEC_PARTNERS, ...VINMEC_PARTNERS];

  return (
    <section className="w-full overflow-hidden py-10 sm:py-14" aria-label="Đối tác y tế toàn cầu">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-6 sm:mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
          Hợp tác chuyên môn với các đại học & tổ chức y tế hàng đầu thế giới
        </p>
      </div>

      {/* Marquee full-màn hình với lớp mặt nạ fade mờ ở 2 mép biên */}
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
