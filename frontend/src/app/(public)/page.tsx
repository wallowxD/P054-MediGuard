import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CtaBand,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  LandingHeader,
} from "@/components/landing";
import { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";
import { VinmecReturnBar } from "@/components/vinmec";
import { SEO_CONFIG } from "@/config/seo-config";
import { buildPublicMetadata } from "@/utils/metadata-utils";

/**
 * Landing page cho khách chưa đăng nhập.
 * Đã đăng nhập thì `src/proxy.ts` đá thẳng về /dashboard, không render trang này.
 *
 * Header/footer đặt ở đây chứ không ở `(public)/layout.tsx`, vì /signin, /signup
 * và trang pháp lý dùng chung layout đó nhưng không cần chrome của landing.
 */
export const metadata: Metadata = buildPublicMetadata(
  `${SEO_CONFIG.brandName} — Hiểu rõ hơn về thuốc bạn đang sử dụng`,
  SEO_CONFIG.description,
  "/"
);

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Chỉ hiện khi tới từ nav Vinmec (`/?from=vinmec`); mặc định render null nên
          trang giữ nguyên như cũ. `<Suspense>` là bắt buộc — bên trong đọc
          `useSearchParams()`, không có ranh giới này thì cả "/" mất prerender. */}
      <Suspense fallback={null}>
        <VinmecReturnBar />
      </Suspense>
      <LandingHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
