import { VINMEC_MILESTONES } from "./vinmec-about-content";

export default function VinmecMilestones() {
  return (
    <section className="py-12 sm:py-16" aria-label="Các cột mốc phát triển">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hành trình phát triển</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Những cột mốc quan trọng
          </h2>
          <p className="text-sm text-foreground-secondary">
            Hành trình không ngừng vươn tới sự hoàn hảo trong chăm sóc y tế.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl space-y-6">
          {VINMEC_MILESTONES.map((milestone) => (
            <div
              key={milestone.year}
              className="flex flex-col sm:flex-row gap-4 sm:gap-8 rounded-3xl liquid-glass p-6 sm:p-8"
            >
              <div className="shrink-0">
                <span className="inline-block font-heading text-3xl font-black text-primary">
                  {milestone.year}
                </span>
              </div>
              <ul className="grid gap-2.5 min-w-0 flex-1">
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
          ))}
        </div>
      </div>
    </section>
  );
}
