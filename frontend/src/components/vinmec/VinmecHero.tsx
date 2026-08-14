"use client";

import { CalendarCheck, Phone, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { VINMEC_BANNERS, VINMEC_QUICK_SERVICES } from "./vinmec-content";

const SLIDE_MS = 6000;

const ICONS = {
  phone: Phone,
  calendar: CalendarCheck,
  user: UserRound,
} as const;

/**
 * Banner hero + thẻ dịch vụ nhanh nổi trên đáy banner.
 *
 * Slider tự chạy nhưng KHÔNG dùng thư viện: ba ảnh xếp chồng, chỉ đổi opacity.
 * Bản gốc dùng glide.js — ở đây chỉ cần đúng hình dạng để demo, thêm một
 * dependency carousel cho một trang trình diễn là không đáng.
 *
 * `prefers-reduced-motion` thì dừng tự động chuyển; người dùng vẫn bấm chấm được.
 */
export default function VinmecHero() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % VINMEC_BANNERS.length),
      SLIDE_MS
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section aria-label="Banner Vinmec">
      <div className="vinmec-hero-frame overflow-hidden bg-[var(--vm-gray-bg)]">
        {VINMEC_BANNERS.map((banner, index) => (
          <Image
            key={banner.src}
            src={banner.src}
            alt={banner.alt}
            fill
            // Banner tràn viền nên luôn rộng bằng viewport.
            sizes="100vw"
            priority={index === 0}
            aria-hidden={index !== active}
            className={`object-cover object-center transition-opacity duration-700 ${
              index === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        {/* Lớp phủ chứa thẻ dịch vụ — bám đáy banner, canh theo container. */}
        <div className="absolute inset-0 flex items-end pb-12 sm:pb-14">
          <div className="vinmec-container">
            <div className="vinmec-cta-card hidden max-w-[850px] rounded-xl bg-white p-7 md:block">
              <ul className="flex items-stretch">
                {VINMEC_QUICK_SERVICES.map((service, index) => {
                  const Icon = ICONS[service.icon];
                  return (
                    <li
                      key={service.name}
                      className={`flex flex-1 gap-2 ${index > 0 ? "pl-4" : ""} ${
                        index < VINMEC_QUICK_SERVICES.length - 1
                          ? "border-r border-[var(--vm-border-soft)] pr-4"
                          : ""
                      }`}
                    >
                      <Icon
                        className="h-[35px] w-[35px] shrink-0 text-[var(--vm-menu-blue)]"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <div>
                        <p className="mb-2 text-base font-semibold text-[var(--vm-text)]">
                          {service.name}
                        </p>
                        <p className="text-[13px] leading-snug text-[var(--vm-text-faint)]">
                          {service.desc}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {VINMEC_BANNERS.map((banner, index) => (
            <button
              key={banner.src}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Xem banner ${index + 1}`}
              aria-current={index === active ? "true" : undefined}
              className={`h-2.5 w-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                index === active ? "bg-[var(--vm-blue)]" : "bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Dưới `md` thẻ dịch vụ rời khỏi banner và xếp dọc — đè lên ảnh ở màn hẹp
          sẽ che mất chính nội dung banner. Bản gốc ẩn hẳn thẻ này trên mobile;
          ở đây giữ lại vì đó là "khu vực giới thiệu dịch vụ" cần có trong demo. */}
      <div className="vinmec-container py-6 md:hidden">
        <ul className="grid gap-4 rounded-xl border border-[var(--vm-border-soft)] bg-white p-5 sm:grid-cols-3">
          {VINMEC_QUICK_SERVICES.map((service) => {
            const Icon = ICONS[service.icon];
            return (
              <li key={service.name} className="flex gap-2">
                <Icon
                  className="h-8 w-8 shrink-0 text-[var(--vm-menu-blue)]"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <div>
                  <p className="mb-1 text-sm font-semibold text-[var(--vm-text)]">{service.name}</p>
                  <p className="text-xs leading-snug text-[var(--vm-text-faint)]">{service.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
