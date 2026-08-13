import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { DEAD_LINK, VINMEC_CERTIFICATIONS } from "./vinmec-content";

/**
 * Dải "Chứng nhận và giải thưởng" — nền xanh đặc tràn viền (#0076c0 của bản gốc),
 * chữ trắng, gạch chân tiêu đề đổi sang trắng qua `.vinmec-title-on-blue`.
 */
export default function VinmecCertifications() {
  return (
    <section className="bg-[var(--vm-blue)] py-12 text-white lg:py-15">
      <div className="vinmec-container grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <h2 className="vinmec-title vinmec-title-on-blue">Chứng nhận và giải thưởng</h2>
          <p className="mb-8 text-sm text-white/90">
            Vinmec tự hào được các tổ chức uy tín trên thế giới công nhận
          </p>
          <a
            href={DEAD_LINK}
            className="vinmec-arrow-link inline-flex w-max items-center gap-2 text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--vm-blue)]"
          >
            Xem thêm
            <ArrowRight className="h-5 w-7" aria-hidden="true" />
          </a>
        </div>

        <ul className="grid grid-cols-3 gap-4 sm:gap-6">
          {VINMEC_CERTIFICATIONS.map((cert) => (
            <li
              key={cert.src}
              className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-white p-3"
            >
              <Image
                src={cert.src}
                alt={cert.alt}
                width={200}
                height={150}
                className="h-full w-full object-contain"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
