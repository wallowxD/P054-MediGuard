import Image from "next/image";
import { VINMEC_ABOUT_PARTNERS } from "./vinmec-about-content";

/**
 * "Đối tác của Vinmec" trên trang Về Vinmec.
 *
 * ★ KHÁC với `VinmecPartners` ở trang chủ: trang chủ chỉ điểm ba logo tiêu biểu,
 *   còn đây là danh sách đầy đủ 10 đối tác của trang `/doi-tac/`. Hai component
 *   trông giống nhau nhưng ăn hai nguồn dữ liệu khác nhau — sửa cái này không đổi
 *   cái kia, và đó là chủ ý.
 */
export default function VinmecAboutPartners() {
  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="vinmec-container">
        <h2 className="vinmec-title vinmec-title-centered text-[var(--vm-text)]">
          Đối tác của Vinmec
        </h2>

        <ul className="mt-8 grid grid-cols-2 items-center justify-items-center gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {VINMEC_ABOUT_PARTNERS.map((partner) => (
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
