import type { Metadata } from "next";
import { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";
import {
  VinmecCertifications,
  VinmecFacilities,
  VinmecFooter,
  VinmecHeader,
  VinmecHero,
  VinmecPartners,
  VinmecWhyUs,
} from "@/components/vinmec";
import { SEO_CONFIG } from "@/config/seo-config";
import { buildPublicMetadata } from "@/utils/metadata-utils";

/**
 * TRANG CHỦ — cổng Vinmec, dựng lại giao diện trang chủ vinmec.com/vie.
 *
 * ★ Đây là "/" kể từ khi hoán đổi route. Màn tra cứu an toàn thuốc chuyển sang
 *   `/tinh-nang` (xem `(public)/tinh-nang/page.tsx`), vào từ mục "Tính năng" trên
 *   nav. Trước đây hai trang này ngược lại — link cũ trỏ "/" giờ ra cổng, không
 *   còn ra màn tra cứu.
 *
 * ★ Nội dung tĩnh hoàn toàn: không API, không đăng nhập, không đặt lịch. Mọi liên
 *   kết trỏ `#` trừ mục "Tính năng".
 *
 * ★ Người đã đăng nhập VẪN xem được trang này — `src/proxy.ts` cố ý không đá họ về
 *   dashboard nữa, vì cổng bệnh viện là trang công khai.
 */
export const metadata: Metadata = buildPublicMetadata(
  `${SEO_CONFIG.brandName} — Hệ thống Y tế`,
  "Hệ thống Y tế Vinmec: chuyên khoa, hệ thống cơ sở y tế, chứng nhận quốc tế và tra cứu an toàn thuốc.",
  "/"
);

export default function VinmecHomePage() {
  return (
    <div className="vinmec-theme flex min-h-screen flex-col">
      <VinmecHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <VinmecHero />
        <VinmecWhyUs />
        <VinmecCertifications />
        <VinmecFacilities />
        <VinmecPartners />
      </main>
      <VinmecFooter />
    </div>
  );
}
