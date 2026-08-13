import Image from "next/image";
import { VINMEC_WHY_US } from "./vinmec-content";

/**
 * "Tại sao nên chọn Vinmec?" — ảnh điều dưỡng bên trái, lưới 2×2 lý do bên phải.
 *
 * Ảnh dùng lại `/images/women.png` đã có sẵn trong repo (chính là ảnh Vinmec dùng
 * ở khu vực này), không tải thêm bản trùng.
 */
export default function VinmecWhyUs() {
  return (
    <section className="bg-[var(--vm-gray-bg)] py-10 lg:pb-16">
      <div className="vinmec-container">
        <h2 className="vinmec-title text-[var(--vm-text)]">Tại sao nên chọn Vinmec?</h2>

        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-4">
          <div className="hidden justify-center lg:col-span-5 lg:flex">
            <Image
              src="/images/women.png"
              alt="Điều dưỡng Vinmec"
              width={567}
              height={765}
              className="h-auto w-full max-w-[420px] object-contain"
            />
          </div>

          <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:col-span-7 lg:pl-12">
            {VINMEC_WHY_US.map((item) => (
              <li key={item.title}>
                <Image
                  src={item.icon}
                  alt=""
                  aria-hidden="true"
                  width={60}
                  height={60}
                  className="mb-4 h-[60px] w-[60px] object-contain"
                />
                <h3 className="mb-2.5 text-xl leading-tight text-[var(--vm-title-blue)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--vm-text)]">{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
