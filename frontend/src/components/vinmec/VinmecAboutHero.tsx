import { Heart, Sparkles, Target } from "lucide-react";
import { VINMEC_ABOUT_INTRO, VINMEC_MISSION, VINMEC_VISION } from "./vinmec-about-content";

export default function VinmecAboutHero() {
  return (
    <section className="pt-10 pb-12 sm:pt-24 sm:pb-16" aria-label="Về Vinmec">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero Headline */}
        <div className="mb-12 max-w-3xl space-y-3">
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
          <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl liquid-glass p-7 sm:p-9 transition-all duration-300 hover:shadow-xl space-y-4">
            <div className="space-y-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">Tầm nhìn</h2>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                {VINMEC_VISION}
              </p>
            </div>
          </div>

          {/* Mission Card */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-3xl liquid-glass p-7 sm:p-9 transition-all duration-300 hover:shadow-xl space-y-4 border-l-4 border-l-primary">
            <div className="space-y-4">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">Sứ mệnh</h2>
              <p className="text-base sm:text-lg font-semibold leading-relaxed text-foreground">
                “{VINMEC_MISSION}”
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
