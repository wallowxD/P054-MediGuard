import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { VINMEC_ABOUT_INTRO, VINMEC_MISSION, VINMEC_VISION } from "./vinmec-about-content";

/**
 * Mở đầu trang "Về Vinmec": breadcrumb → tiêu đề → giới thiệu chung → tầm nhìn và
 * sứ mệnh.
 *
 * ★ Breadcrumb theo đúng bản gốc là ba cấp "Trang chủ › Về Vinmec › Tầm nhìn và sứ
 *   mệnh". Bản mô phỏng gộp ba trang thành một nên chỉ còn hai cấp — cấp thứ ba
 *   không tồn tại thì không dựng ra cho giống, vì bấm vào sẽ chẳng dẫn đi đâu.
 *
 * ★ Chỉ "Trang chủ" là link thật; "Về Vinmec" là trang hiện tại nên render thành
 *   `<span aria-current="page">`, không phải link tự trỏ về chính nó.
 */
export default function VinmecAboutHero() {
  return (
    <section className="pb-12 pt-6">
      <div className="vinmec-container">
        <nav aria-label="Đường dẫn" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-[13px] text-[var(--vm-text-muted)]">
            <li>
              <Link
                href={ROUTES.HOME}
                className="transition-colors hover:text-[var(--vm-menu-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)] focus-visible:ring-offset-2"
              >
                Trang chủ
              </Link>
            </li>
            <li aria-hidden="true" className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </li>
            <li>
              <span aria-current="page" className="text-[var(--vm-text)]">
                Về Vinmec
              </span>
            </li>
          </ol>
        </nav>

        <h1 className="vinmec-title text-[var(--vm-text)]">Về Vinmec</h1>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-7">
            <h2 className="mb-3 text-xl leading-tight text-[var(--vm-title-blue)]">
              Giới thiệu chung
            </h2>
            <p className="mb-8 text-[15px] leading-relaxed text-[var(--vm-text)]">
              {VINMEC_ABOUT_INTRO}
            </p>

            <h2 className="mb-3 text-xl leading-tight text-[var(--vm-title-blue)]">Tầm nhìn</h2>
            <p className="mb-8 text-[15px] leading-relaxed text-[var(--vm-text)]">{VINMEC_VISION}</p>

            <h2 className="mb-3 text-xl leading-tight text-[var(--vm-title-blue)]">Sứ mệnh</h2>
            {/* Câu sứ mệnh là khẩu hiệu, bản gốc để cỡ lớn hơn phần thân bài. */}
            <p className="border-l-4 border-[var(--vm-green-line)] pl-4 text-lg font-medium leading-relaxed text-[var(--vm-text)]">
              {VINMEC_MISSION}
            </p>
          </div>

          <div className="lg:col-span-5">
            <Image
              src="/images/vinmec/about-vision.png"
              alt="Tầm nhìn và sứ mệnh của Hệ thống Y tế Vinmec"
              width={924}
              height={525}
              className="h-auto w-full rounded-md object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
