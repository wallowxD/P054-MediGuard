import type { Metadata } from "next";
import {
  CtaBand,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
} from "@/components/landing";
import { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";
import { VinmecFooter, VinmecHeader } from "@/components/vinmec";
import { ROUTES } from "@/constants/routes";
import { SEO_CONFIG } from "@/config/seo-config";
import { buildPublicMetadata } from "@/utils/metadata-utils";

/**
 * Màn "Tính năng" — tra cứu an toàn thuốc, một trang BÊN TRONG cổng Vinmec.
 *
 * ★ Trang này từng nằm ở "/" trước khi hoán đổi route; nay "/" là trang chủ Vinmec.
 *   Mục "Tính năng" trên nav trỏ tới đây và sáng active khi đang ở đây.
 *
 * ★ Header/footer dùng chung với trang chủ (`VinmecHeader` / `VinmecFooter`) để hai
 *   màn trông như một website duy nhất. `LandingHeader` và `LandingFooter` cũ vì
 *   vậy KHÔNG còn được render ở đâu nữa — giữ file lại phòng khi cần quay về giao
 *   diện cũ, nhưng đừng nhầm là chúng vẫn đang chạy.
 *
 * ★ Phần thân giữ nguyên các section cũ: chỉ lớp vỏ đổi sang Vinmec, nội dung tra
 *   cứu thuốc không đụng tới.
 */
export const metadata: Metadata = buildPublicMetadata(
  `${SEO_CONFIG.brandName} — Hiểu rõ hơn về thuốc bạn đang sử dụng`,
  SEO_CONFIG.description,
  ROUTES.FEATURE
);

export default function FeaturePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <VinmecHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaBand />
      </main>
      <VinmecFooter medicalDisclaimer />
    </div>
  );
}
