"use client";

import { Building2, ChevronLeft, ChevronRight, MapPin, Sparkles } from "lucide-react";
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

        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Main Visual Display */}
          <div className="relative lg:col-span-7">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl liquid-glass p-2">
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-surface">
                <Image
                  src={current.large}
                  alt={current.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 700px"
                  className="object-cover transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl liquid-glass-strong p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Cơ sở y tế tiêu chuẩn quốc tế</span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground sm:text-lg">
                    {current.name}
                  </h3>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Cơ sở trước"
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full liquid-glass-pill text-foreground hover:scale-110 active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Cơ sở tiếp theo"
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full liquid-glass-pill text-foreground hover:scale-110 active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right Thumbnails & Selection List */}
          <div className="lg:col-span-5 space-y-2.5">
            {VINMEC_FACILITIES.map((facility, idx) => {
              const isSelected = idx === active;
              return (
                <button
                  key={facility.name}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={`w-full flex items-center gap-3.5 rounded-2xl p-3 text-left transition-all duration-200 ${
                    isSelected
                      ? "liquid-glass border-primary/40 shadow-md ring-1 ring-primary/20 scale-[1.02]"
                      : "liquid-glass-subtle hover:bg-surface/60 opacity-80 hover:opacity-100"
                  }`}
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-surface">
                    <Image
                      src={facility.thumb}
                      alt={facility.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {facility.name}
                    </p>
                    <p className="truncate text-[11px] text-foreground-muted">
                      Tiêu chuẩn JCI / CAP Hoa Kỳ
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
