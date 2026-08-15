import type { Metadata } from "next";
import { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";
import {
  VinmecAboutHero,
  VinmecAboutPartners,
  VinmecAwards,
  VinmecCapacity,
  VinmecCareValues,
  VinmecFooter,
  VinmecHeader,
  VinmecMilestones,
} from "@/components/vinmec";
import { ROUTES } from "@/constants/routes";
import { buildPublicMetadata } from "@/utils/metadata-utils";

/**
 * Trang "Về Vinmec" — dựng lại nhóm menu "Về Vinmec" của vinmec.com/vie.
 *
 * ★ Trên bản gốc "Về Vinmec" KHÔNG phải một trang mà là nhóm menu 9 mục, mỗi mục
 *   một trang riêng (`/tam-nhin-va-su-menh/`, `/thanh-tuu-va-giai-thuong/`,
 *   `/doi-tac/`…). Bản mô phỏng gộp phần nội dung chính của ba trang đầu vào một
 *   route duy nhất, nên mọi mục con trong dropdown đều dẫn về đây. Ai mong bấm
 *   "Tin tức" ra trang tin riêng sẽ thấy trang này — đó là giới hạn đã biết của
 *   bản gộp, không phải link hỏng.
 *
 * ★ Nội dung tĩnh hoàn toàn: không API, không state, không đăng nhập. Toàn bộ chữ
 *   và số nằm trong `vinmec-about-content.ts`.
 *
 * ★ Dùng chung `VinmecHeader`/`VinmecFooter` với trang chủ và màn tính năng để ba
 *   màn trông như một website duy nhất.
 *
 * ★ `vinmec-theme` bọc ở đây để lấy `--vm-body-width` và font. Bản thân các biến
 *   `--vm-*` nay sống trong `:root` (globals.css) nên `/tinh-nang` không cần lớp bọc
 *   này vẫn đúng màu.
 */
export const metadata: Metadata = buildPublicMetadata(
  "Về Vinmec — Tầm nhìn, sứ mệnh và thành tựu",
  "Tầm nhìn, sứ mệnh, giá trị cốt lõi C.A.R.E, năng lực hệ thống, giải thưởng quốc tế " +
    "và các cột mốc phát triển của Hệ thống Y tế Vinmec.",
  ROUTES.ABOUT
);

export default function AboutVinmecPage() {
  return (
    <div className="vinmec-theme flex min-h-screen flex-col">
      <VinmecHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <VinmecAboutHero />
        <VinmecCareValues />
        <VinmecCapacity />
        <VinmecAwards />
        <VinmecMilestones />
        <VinmecAboutPartners />
      </main>
      <VinmecFooter />
    </div>
  );
}
