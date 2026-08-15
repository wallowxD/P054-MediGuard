import { VINMEC_CAPACITY_STATS } from "./vinmec-about-content";

export default function VinmecCapacity() {
  return (
    <section className="py-12 sm:py-16" aria-label="Năng lực hệ thống">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl liquid-glass p-8 sm:p-12">
          <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Quy mô & Năng lực</p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Năng lực phục vụ lâm sàng toàn diện
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {VINMEC_CAPACITY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse justify-between rounded-2xl liquid-glass-subtle p-4 transition-transform duration-300 hover:scale-105"
              >
                <dt className="mt-2 text-xs leading-snug text-foreground-secondary">{stat.label}</dt>
                <dd className="font-heading text-2xl font-bold text-primary sm:text-3xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
