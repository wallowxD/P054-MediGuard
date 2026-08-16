import {
  ArrowRight,
  CalendarCheck,
  Phone,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { VINMEC_QUICK_SERVICES } from "./vinmec-content";

const ICONS = {
  phone: Phone,
  calendar: CalendarCheck,
  user: UserRound,
} as const;

export default function VinmecHero() {
  // Khoảng hở dưới header phải khớp với `/ve-vinmec` (VinmecAboutHero) — hai trang dùng
  // chung header, lệch nhau thì lúc chuyển trang nội dung nhảy lên xuống. Sửa một chỗ thì
  // sửa cả hai.
  //
  // Con số này KHÔNG bằng `/tinh-nang`: hero ở đó dành hẳn 620px cho canvas WebGL của
  // viên thuốc. Trang chủ dùng ảnh chữ thập nhẹ hơn và còn có dải dịch vụ phía dưới,
  // nên giữ nhịp dọc riêng thay vì ép hai hero cao bằng nhau.
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

          {/* Right Floating Medical Cross — cùng ngôn ngữ vật thể 3D với viên thuốc. */}
          <div className="relative lg:col-span-5">
            <div
              className="relative flex min-h-[24rem] items-center justify-center sm:min-h-[30rem] lg:min-h-[34rem]"
              aria-label="Minh hoạ chữ thập y tế 3D"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/20 blur-3xl sm:h-96 sm:w-96 dark:bg-red-500/15"
              />
              <Image
                src="/medical-cross-render.png"
                alt="Chữ thập y tế màu đỏ dạng 3D"
                width={1254}
                height={1254}
                priority
                sizes="(max-width: 1024px) 88vw, 520px"
                className="vinmec-medical-cross relative z-10 h-auto w-[88%] max-w-[32rem] select-none object-contain"
              />
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
