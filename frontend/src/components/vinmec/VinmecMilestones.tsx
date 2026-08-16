import { VINMEC_MILESTONES } from "./vinmec-about-content";

export default function VinmecMilestones() {
  return (
    <section className="py-14 sm:py-20" aria-label="Các cột mốc phát triển">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-14 text-center max-w-2xl mx-auto space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hành trình phát triển</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Những cột mốc quan trọng
          </h2>
          <p className="text-sm text-foreground-secondary">
            Hành trình hơn một thập kỷ không ngừng vươn tới sự hoàn hảo trong chăm sóc y tế.
          </p>
        </div>

        {/* Vertical Timeline Track */}
        <div className="relative mx-auto max-w-3xl">
          {/* Central spine line */}
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-transparent sm:left-8" />

          <div className="space-y-8">
            {VINMEC_MILESTONES.map((milestone) => (
              <div
                key={milestone.year}
                className="group relative flex items-start gap-6 sm:gap-8"
              >
                {/* Node Pill */}
                <div className="relative z-10 flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl liquid-glass border border-primary/40 font-heading text-base sm:text-lg font-black text-primary shadow-md transition-transform duration-300 group-hover:scale-110">
                  {milestone.year}
                </div>

                {/* Content Card */}
                <div className="flex-1 rounded-3xl liquid-glass p-6 sm:p-7 transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30">
                  <ul className="space-y-2.5">
                    {milestone.events.map((event) => (
                      <li
                        key={event}
                        className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-foreground-secondary"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{event}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
