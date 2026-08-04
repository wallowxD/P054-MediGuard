import type { Metadata } from "next";
import {
  CtaBand,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  LandingFooter,
  LandingHeader,
} from "@/components/landing";
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
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaBand />
      </main>
      <LandingFooter />
    </div>
  );
}
