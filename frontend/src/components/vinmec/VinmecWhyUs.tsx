import { Award, BrainCircuit, HeartHandshake, ShieldCheck } from "lucide-react";
import { VINMEC_WHY_US } from "./vinmec-content";

const FEATURE_ICONS = [HeartHandshake, ShieldCheck, BrainCircuit, Award];

export default function VinmecWhyUs() {
  return (
    <section className="py-14 sm:py-20" aria-label="Giá trị vượt trội của Vinmec">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Giá trị vượt trội</p>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tại sao nên chọn Hệ thống Vinmec?
          </h2>
          <p className="text-sm text-foreground-secondary sm:text-base">
            Tiên phong chuẩn mực quốc tế kết hợp trí tuệ nhân tạo y khoa để mang đến sự an toàn và hiệu quả cao nhất.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VINMEC_WHY_US.map((item, idx) => {
            const Icon = FEATURE_ICONS[idx % FEATURE_ICONS.length];
            return (
              <div
                key={item.title}
                className="group relative flex flex-col items-center justify-center text-center rounded-2xl liquid-glass px-4 py-6 sm:px-5 sm:py-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-3.5 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-sm sm:text-[15px] xl:text-base font-bold text-foreground tracking-tight whitespace-nowrap">
                  {item.title}
                </h3>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
