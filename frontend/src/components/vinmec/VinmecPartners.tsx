import Image from "next/image";
import { VINMEC_PARTNERS } from "./vinmec-content";

/** "Đối tác của chúng tôi" — tiêu đề căn giữa, gạch chân căn giữa theo bản gốc. */
export default function VinmecPartners() {
  return (
    <section className="bg-white pb-15 pt-6">
      <div className="vinmec-container">
        <h2 className="vinmec-title vinmec-title-centered text-[var(--vm-text)]">
          Đối tác của chúng tôi
        </h2>

        <ul className="mt-8 grid grid-cols-1 items-center justify-items-center gap-8 sm:grid-cols-3">
          {VINMEC_PARTNERS.map((partner) => (
            <li key={partner.src}>
              <Image
                src={partner.src}
                alt={partner.alt}
                width={220}
                height={80}
                className="h-14 w-auto object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
