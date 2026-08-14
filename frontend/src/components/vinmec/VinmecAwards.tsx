import Image from "next/image";
import { VINMEC_AWARDS } from "./vinmec-about-content";

/**
 * "Giải thưởng & Chứng nhận" — mỗi giải một thẻ: logo bên trái, nội dung bên phải.
 *
 * Logo là ảnh nhận diện của tổ chức cấp chứng nhận nên `alt` để rỗng và
 * `aria-hidden` — tên tổ chức đã nằm ngay trong `<h3>` bên cạnh, đọc lại là thừa.
 */
export default function VinmecAwards() {
  return (
    <section className="py-12 lg:py-16">
      <div className="vinmec-container">
        <h2 className="vinmec-title text-[var(--vm-text)]">Giải thưởng & Chứng nhận</h2>
        <p className="mb-8 max-w-3xl text-[15px] leading-relaxed text-[var(--vm-text)]">
          Tại Vinmec, chúng tôi nỗ lực hướng tới sự xuất sắc bằng cách cung cấp dịch vụ chăm sóc
          đẳng cấp thế giới, tiên phong trong nghiên cứu và đổi mới. Vinmec đã được ghi nhận cho
          những nỗ lực theo đuổi chất lượng quốc tế và sự an toàn cao nhất cho mọi bệnh nhân.
        </p>

        <ul className="grid gap-6 lg:grid-cols-2">
          {VINMEC_AWARDS.map((award) => (
            <li
              key={award.name}
              className="flex h-full gap-5 rounded-md border border-[var(--vm-border)] p-5"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                <Image
                  src={award.logo}
                  alt=""
                  aria-hidden="true"
                  width={160}
                  height={160}
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h3 className="mb-1 text-base font-semibold leading-snug text-[var(--vm-title-blue)]">
                  {award.name}
                </h3>
                <p className="mb-2 text-[13px] italic leading-snug text-[var(--vm-text-muted)]">
                  {award.subtitle}
                </p>
                <p className="text-sm leading-relaxed text-[var(--vm-text)]">{award.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
