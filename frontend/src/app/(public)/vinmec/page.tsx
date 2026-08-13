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

/**
 * Cổng Vinmec mô phỏng — dựng lại giao diện trang chủ vinmec.com/vie để trình diễn
 * luồng "bệnh nhân đang ở cổng bệnh viện → bấm MediGuard → sang trợ lý an toàn thuốc".
 *
 * ★ KHÔNG phải một phần của sản phẩm. Toàn bộ nội dung là tĩnh, không API, không
 *   đăng nhập, không đặt lịch. Mọi liên kết trỏ `#` trừ mục "MediGuard" trên nav.
 *
 * ★ `robots: noindex` + không có mặt trong sitemap: trang mang thương hiệu của một
 *   tổ chức có thật, chỉ dùng nội bộ cho buổi demo. Xem ghi chú tại DEMO_ROUTES
 *   trong `constants/routes.ts`.
 */
export const metadata: Metadata = {
  title: "Vinmec — bản mô phỏng phục vụ trình diễn",
  description:
    "Bản dựng giao diện tĩnh mô phỏng cổng Vinmec, dùng để trình diễn luồng điều hướng sang MediGuard.",
  robots: { index: false, follow: false },
};

export default function VinmecPortalPage() {
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
