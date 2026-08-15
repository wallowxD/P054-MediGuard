import Image from "next/image";
import { VINMEC_PARTNERS } from "./vinmec-content";

export default function VinmecPartners() {
  return (
    <section className="py-12 sm:py-16" aria-label="Đối tác y tế toàn cầu">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl liquid-glass-subtle p-6 sm:p-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted mb-6">
            Hợp tác chuyên môn với các đại học & tổ chức y tế hàng đầu thế giới
          </p>
          <div className="flex flex-wrap items-center justify-around gap-8">
            {VINMEC_PARTNERS.map((partner) => (
              <div
                key={partner.src}
                // `logo-plate`: logo đối tác là ảnh nền trong suốt mực sẫm, trên nền tối
                // sẽ biến mất hẳn. Class này trả lại nền sáng cho riêng chế độ tối.
                className="logo-plate rounded-2xl border border-transparent px-3 py-2 grayscale opacity-75 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:scale-105"
              >
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  width={180}
                  height={60}
                  className="h-10 w-auto object-contain sm:h-12"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
