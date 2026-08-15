import { ChevronRight, Heart, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { VINMEC_ABOUT_INTRO, VINMEC_MISSION, VINMEC_VISION } from "./vinmec-about-content";

export default function VinmecAboutHero() {
  return (
    <section className="pt-4 pb-12 sm:pt-6 sm:pb-16" aria-label="Về Vinmec">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Đường dẫn" className="mb-6">
          <ol className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <li>
              <Link href={ROUTES.HOME} className="transition-colors hover:text-primary">
                Trang chủ
              </Link>
            </li>
            <li aria-hidden><ChevronRight className="h-3 w-3 opacity-60" /></li>
            <li><span aria-current="page" className="font-semibold text-foreground">Về Vinmec</span></li>
          </ol>
        </nav>

        {/* Hero Headline */}
        <div className="mb-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tầm nhìn & Sứ mệnh</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Kiến tạo chuẩn mực y tế hàn lâm và an toàn người bệnh
          </h1>
          <p className="text-sm leading-relaxed text-foreground-secondary sm:text-base">
            {VINMEC_ABOUT_INTRO}
          </p>
        </div>

        {/* Vision & Mission Bento Cards */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Vision Card */}
          <div className="lg:col-span-6 rounded-3xl liquid-glass p-6 sm:p-8 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">Tầm nhìn</h2>
            <p className="text-sm leading-relaxed text-foreground-secondary">
              {VINMEC_VISION}
            </p>
          </div>

          {/* Mission Card */}
          <div className="lg:col-span-6 rounded-3xl liquid-glass p-6 sm:p-8 space-y-4 border-l-4 border-l-primary">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Heart className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">Sứ mệnh</h2>
            <p className="text-base font-semibold leading-relaxed text-foreground">
              {VINMEC_MISSION}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
