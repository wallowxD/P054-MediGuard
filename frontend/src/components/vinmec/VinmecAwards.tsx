import Image from "next/image";
import { VINMEC_AWARDS } from "./vinmec-about-content";

export default function VinmecAwards() {
  return (
    <section className="py-12 sm:py-16" aria-label="Giải thưởng và Chứng nhận">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Uy tín quốc tế</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Giải thưởng & Chứng nhận
          </h2>
          <p className="text-sm text-foreground-secondary">
            Ghi nhận từ các tổ chức y tế uy tín thế giới cho nỗ lực theo đuổi sự an toàn cao nhất cho người bệnh.
          </p>
        </div>

        <ul className="grid gap-6 lg:grid-cols-2">
          {VINMEC_AWARDS.map((award) => (
            <li
              key={award.name}
              className="flex gap-5 rounded-3xl liquid-glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Ba logo giải thưởng là PNG nền trong suốt — cần `logo-plate` cho chế độ tối. */}
              <div className="logo-plate flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl liquid-glass-subtle p-2">
                <Image
                  src={award.logo}
                  alt=""
                  aria-hidden="true"
                  width={120}
                  height={120}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="mb-1 font-heading text-base font-bold text-foreground">
                  {award.name}
                </h3>
                <p className="mb-2 text-xs font-medium text-primary">
                  {award.subtitle}
                </p>
                <p className="text-xs leading-relaxed text-foreground-secondary">{award.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
