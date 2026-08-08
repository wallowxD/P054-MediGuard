import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/config/seo-config";
import { AUTH_ROUTES, ROUTES } from "@/constants/routes";

/**
 * Sinh động thay cho `public/robots.txt` tĩnh.
 *
 * Lý do đổi: bản tĩnh phải hardcode URL sitemap. Deploy lên domain thật là nó vẫn
 * trỏ về localhost:3000 — sai âm thầm, không ai phát hiện cho tới khi Google bỏ qua
 * sitemap. Ở đây URL lấy từ SEO_CONFIG nên đi theo NEXT_PUBLIC_APP_URL.
 *
 * Chặn mọi route sau đăng nhập; landing page và trang pháp lý để mở.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ROUTES.HOME,
      disallow: [
        ...AUTH_ROUTES,
        ROUTES.DASHBOARD,
        ROUTES.DRUG_INFORMATION,
        ROUTES.INTERACTIONS,
        ROUTES.SETTINGS,
        ROUTES.REVIEW,
        "/api",
      ],
    },
    sitemap: `${SEO_CONFIG.url}/sitemap.xml`,
  };
}
