import { VINMEC_CARE_VALUES } from "./vinmec-about-content";

export default function VinmecCareValues() {
  return (
    <section className="py-12 sm:py-16" aria-label="Giá trị cốt lõi C.A.R.E">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Giá trị cốt lõi</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bộ giá trị văn hóa C.A.R.E
          </h2>
          <p className="text-sm text-foreground-secondary">
            Kim chỉ nam cho mọi hành động và quyết định chuyên môn tại Vinmec.
          </p>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VINMEC_CARE_VALUES.map((value) => (
            <li
              key={value.letter}
              className="group relative flex flex-col rounded-3xl liquid-glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <span
                aria-hidden="true"
                className="mb-3 font-heading text-5xl font-black text-primary/40 transition-colors group-hover:text-primary"
              >
                {value.letter}
              </span>
              <h3 className="mb-2 font-heading text-base font-bold text-foreground">
                {value.title}
              </h3>
              <p className="text-xs leading-relaxed text-foreground-secondary">
                {value.desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
