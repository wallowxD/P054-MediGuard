"use client";

import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  FileSearch,
  Phone,
  Pill,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { VINMEC_BANNERS, VINMEC_QUICK_SERVICES } from "./vinmec-content";

const SLIDE_MS = 7000;

const ICONS = {
  phone: Phone,
  calendar: CalendarCheck,
  user: UserRound,
} as const;

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

  // Khoảng hở dưới header phải khớp với `/ve-vinmec` (VinmecAboutHero) — hai trang dùng
  // chung header, lệch nhau thì lúc chuyển trang nội dung nhảy lên xuống. Sửa một chỗ thì
  // sửa cả hai.
  //
  // Con số này KHÔNG bằng `/tinh-nang`: hero ở đó là grid `items-center` có cột phải cao
  // 620px (canvas viên thuốc 3D), nên cột chữ bị đẩy xuống giữa và tự có khoảng hở lớn.
  // Ở đây cột trái mới là cột cao nhất nên nó bám sát padding — muốn rộng bằng thì phải
  // cộng thẳng vào padding, không có cách nào lấy lại bằng layout.
  return (
    <section aria-label="Vinmec Smart Health Hero" className="relative overflow-hidden pt-10 pb-12 sm:pt-24 sm:pb-16">
      {/*
        ★ Ánh sáng nền nằm ở `.landing-theme::before` (globals.css), không đặt ở đây.
        Section có `overflow-hidden` nên mọi lớp blur đặt trong nó sẽ bị cắt phẳng tại
        mép section, tạo đường kẻ ngang ngay dưới header — xem ghi chú dài hơn trong
        `landing/HeroSection.tsx`.
      */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Main Hero Bento Frame */}
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Text & CTA */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span>Hệ sinh thái Y tế Thông minh & AI An toàn Thuốc</span>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.12]">
              Chuẩn mực y tế quốc tế.{" "}
              {/* Gradient phải có bậc riêng cho nền tối: `#0066cc` là màu tính cho nền
                  sáng, đặt lên nền tối thì nửa đầu dòng chữ chìm hẳn. */}
              <span className="bg-gradient-to-r from-[#0066cc] via-[#0284c7] to-[#10b981] bg-clip-text text-transparent dark:from-[#58b6ff] dark:via-[#7dd3fc] dark:to-[#34d399]">
                An toàn tối đa
              </span>{" "}
              cho từng phác đồ.
            </h1>

            <p className="max-w-2xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
              Vinmec kết hợp chuyên môn y khoa hàng đầu với công nghệ đối chiếu tương tác thuốc
              có dẫn nguồn nguyên văn, giúp người bệnh và bác sĩ an tâm trong từng quyết định điều trị.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={ROUTES.FEATURE}
                className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-b from-[#0077ed] to-[#0066cc] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(0,102,204,0.35)] transition-all hover:brightness-105 hover:shadow-[0_8px_25px_rgba(0,102,204,0.45)] active:scale-95"
              >
                <span>Trải nghiệm Trợ lý An toàn Thuốc</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href={ROUTES.ABOUT}
                className="inline-flex items-center gap-2 rounded-full liquid-glass-button px-5 py-3.5 text-sm font-semibold text-foreground-secondary hover:text-foreground"
              >
                <span>Về Hệ thống Vinmec</span>
              </Link>
            </div>

            {/* Key Trust Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-4 sm:max-w-lg">
              <div className="liquid-glass-subtle rounded-2xl p-3 text-center">
                <p className="font-heading text-lg font-bold text-primary sm:text-xl">JCI</p>
                <p className="text-[11px] text-foreground-muted">Chuẩn vàng quốc tế</p>
              </div>
              <div className="liquid-glass-subtle rounded-2xl p-3 text-center">
                <p className="font-heading text-lg font-bold text-emerald-600 dark:text-emerald-400 sm:text-xl">100%</p>
                <p className="text-[11px] text-foreground-muted">Có dẫn nguồn HDSD</p>
              </div>
              <div className="liquid-glass-subtle rounded-2xl p-3 text-center">
                <p className="font-heading text-lg font-bold text-foreground sm:text-xl">07</p>
                <p className="text-[11px] text-foreground-muted">Bệnh viện Toàn quốc</p>
              </div>
            </div>
          </div>

          {/* Right Floating Visual Showcase (Apple Glass Mockup) */}
          <div className="relative lg:col-span-5">
            <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-3xl liquid-glass p-2">
              {/* Slider image background */}
              <div className="relative h-full w-full overflow-hidden rounded-2xl bg-surface">
                {VINMEC_BANNERS.map((banner, index) => (
                  <Image
                    key={banner.src}
                    src={banner.src}
                    alt={banner.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 550px"
                    priority={index === 0}
                    aria-hidden={index !== active}
                    className={`object-cover transition-opacity duration-1000 ${
                      index === active ? "opacity-100 scale-100" : "opacity-0 scale-105"
                    }`}
                  />
                ))}

                {/* Dark gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Floating Glass AI Live Widget */}
                <div className="absolute bottom-3 left-3 right-3 rounded-2xl liquid-glass-strong p-3.5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Trợ lý An toàn Thuốc Vinmec</p>
                        <p className="text-[11px] text-foreground-muted">Đối chiếu tương tác đa tầng theo thời gian thực</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> JCI Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider Dots */}
              <div className="absolute top-4 right-4 flex gap-1.5 rounded-full liquid-glass-pill px-2.5 py-1">
                {VINMEC_BANNERS.map((banner, index) => (
                  <button
                    key={banner.src}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Xem slide ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === active ? "w-5 bg-primary" : "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Services Glass Bento Bar */}
        <div className="mt-8 rounded-3xl liquid-glass p-4 sm:p-6">
          <ul className="grid gap-4 sm:grid-cols-3">
            {VINMEC_QUICK_SERVICES.map((service) => {
              const Icon = ICONS[service.icon];
              return (
                <li
                  key={service.name}
                  className="flex items-center gap-3.5 rounded-2xl p-2 transition-colors hover:bg-surface/60"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{service.name}</p>
                    <p className="text-xs text-foreground-muted">{service.desc}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
