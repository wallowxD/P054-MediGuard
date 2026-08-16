"use client";

import { Building2, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { VINMEC_FACILITIES } from "./vinmec-content";

export default function VinmecFacilities() {
  const [active, setActive] = useState(0);
  const total = VINMEC_FACILITIES.length;
  const current = VINMEC_FACILITIES[active];

  const step = (delta: number) => setActive((index) => (index + delta + total) % total);

  return (
    <section className="py-14 sm:py-20" aria-label="Hệ thống cơ sở y tế Vinmec">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Mạng lưới chăm sóc</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hệ thống Bệnh viện & Phòng khám
          </h2>
          <p className="text-sm text-foreground-secondary">
            Hiện diện tại các trung tâm kinh tế và du lịch trọng điểm trên khắp Việt Nam.
          </p>
        </div>

        {/* Single Centered Showcase */}
        <div className="mx-auto max-w-4xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl liquid-glass p-2 shadow-xl">
            <div className="relative h-full w-full overflow-hidden rounded-2xl bg-surface">
              <Image
                src={current.large}
                alt={current.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 900px"
                className="object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

              {/* Bottom Info Banner */}
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl liquid-glass-strong p-4 sm:p-5 backdrop-blur-xl">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Cơ sở y tế tiêu chuẩn quốc tế (JCI / CAP Hoa Kỳ)</span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground sm:text-xl">
                    {current.name}
                  </h3>
                </div>

                {/* Counter Badge */}
                <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {active + 1} / {total}
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Cơ sở trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full liquid-glass-pill text-foreground hover:scale-110 active:scale-95 shadow-md"
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Cơ sở tiếp theo"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full liquid-glass-pill text-foreground hover:scale-110 active:scale-95 shadow-md"
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>

          {/* Dot Indicators */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {VINMEC_FACILITIES.map((facility, idx) => (
              <button
                key={facility.name}
                type="button"
                onClick={() => setActive(idx)}
                aria-label={`Chuyển đến ${facility.name}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === active
                    ? "w-8 bg-primary shadow-xs"
                    : "w-2 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
