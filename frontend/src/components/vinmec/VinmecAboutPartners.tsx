import Image from "next/image";
import { VINMEC_ABOUT_PARTNERS } from "./vinmec-about-content";

export default function VinmecAboutPartners() {
  return (
    <section className="py-12 sm:py-16" aria-label="Đối tác chiến lược">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl liquid-glass p-8 sm:p-12">
          <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Hợp tác quốc tế</p>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Mạng lưới đối tác học thuật & công nghệ toàn cầu
            </h2>
          </div>

          <ul className="grid grid-cols-2 items-center justify-items-center gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {VINMEC_ABOUT_PARTNERS.map((partner) => (
              <li
                key={partner.src}
                // `logo-plate` phải đứng sau `liquid-glass-subtle` về thứ tự CSS để thắng
                // nền kính tối — xem ghi chú ở globals.css.
                className="logo-plate flex h-20 w-full items-center justify-center rounded-2xl liquid-glass-subtle p-3 grayscale opacity-80 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:scale-105"
              >
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  width={180}
                  height={60}
                  className="h-10 w-auto object-contain"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
