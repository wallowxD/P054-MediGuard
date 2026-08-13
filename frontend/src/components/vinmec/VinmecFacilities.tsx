"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { VINMEC_FACILITIES } from "./vinmec-content";

/**
 * "Hệ thống phòng khám và trung tâm của chúng tôi".
 *
 * Ảnh lớn bên trái có nút prev/next; dải thumbnail bên phải bấm chọn được. Đây là
 * phần duy nhất của trang có tương tác dữ liệu — nhưng vẫn hoàn toàn cục bộ, chỉ
 * đổi chỉ số ảnh đang xem, không gọi API.
 */
export default function VinmecFacilities() {
  const [active, setActive] = useState(0);
  const total = VINMEC_FACILITIES.length;
  const current = VINMEC_FACILITIES[active];

  const step = (delta: number) => setActive((index) => (index + delta + total) % total);

  return (
    <section className="bg-white py-12 lg:py-15">
      <div className="vinmec-container grid gap-8 lg:grid-cols-2 lg:gap-10">
        {/* `min-w-0`: grid item mặc định có `min-width: auto`, tức KHÔNG co được nhỏ
            hơn min-content của nội dung bên trong. Dải thumbnail ở cột kia rộng
            608px (5×112 + gap), nên nếu thiếu `min-w-0` thì track của grid bị đẩy
            lên 608px và cả trang tràn ngang trên mobile — `overflow-x-auto` của
            chính dải đó không cứu được, vì phần tràn nằm ở tầng grid phía trên. */}
        <div className="relative order-2 min-w-0 lg:order-1 lg:pr-11">
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[var(--vm-gray-bg)]">
            <Image
              src={current.large}
              alt={current.name}
              fill
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover"
            />
          </div>

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Cơ sở trước"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[var(--vm-text)] shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)]"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Cơ sở tiếp theo"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[var(--vm-text)] shadow-md transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)] lg:right-13"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          <h2 className="vinmec-title text-[var(--vm-text)]">
            Hệ thống phòng khám và trung tâm của chúng tôi
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-[var(--vm-text)]">
            Vinmec là Hệ thống Y tế tư nhân tại Việt Nam hoạt động không vì mục tiêu lợi
            nhuận, có 2 bệnh viện đạt chứng chỉ tiêu chuẩn JCI – Tiêu chuẩn về an toàn
            người bệnh và chất lượng bệnh viện khắt khe trên thế giới, cùng các chứng chỉ
            quốc tế trong từng lĩnh vực chuyên môn uy tín.
          </p>

          {/* Dải thumbnail cuộn ngang. Lớp phủ gradient ở mép phải tái hiện
              `.list-clinic-thumb::after` của bản gốc — nó biến chỗ ảnh bị cắt
              thành hiệu ứng mờ dần có chủ đích thay vì một vết cắt cụt. */}
          <div className="relative">
            <ul className="flex gap-3 overflow-x-auto pb-2">
              {VINMEC_FACILITIES.map((facility, index) => (
                <li key={facility.thumb} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={facility.name}
                    aria-current={index === active ? "true" : undefined}
                    className={`relative block h-[74px] w-[112px] overflow-hidden rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)] ${
                      index === active
                        ? "ring-2 ring-[var(--vm-blue)]"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={facility.thumb}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 top-0 w-12 bg-gradient-to-l from-white to-transparent"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          className="rounded-[25px] bg-[var(--vm-green)] px-9 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-green)] focus-visible:ring-offset-2"
        >
          Xem thêm
        </button>
      </div>
    </section>
  );
}
