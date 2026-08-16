import { VINMEC_CAPACITY_STATS } from "./vinmec-about-content";

export default function VinmecCapacity() {
  return (
    <section className="py-12 sm:py-16" aria-label="Năng lực hệ thống">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl liquid-glass p-7 sm:p-10">
          <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Quy mô & Năng lực</p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Năng lực phục vụ lâm sàng toàn diện
            </h2>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {VINMEC_CAPACITY_STATS.map((stat) => (
              <div
                key={stat.label}
                className="group flex flex-col justify-between rounded-2xl liquid-glass-subtle p-5 transition-all duration-300 hover:scale-105 hover:shadow-md hover:border-primary/40"
              >
                <dd className="font-heading text-2xl sm:text-3xl font-black text-primary mb-2 transition-transform duration-200 group-hover:translate-x-0.5">
                  {stat.value}
                </dd>
                <dt className="text-xs font-medium leading-snug text-foreground-secondary">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
