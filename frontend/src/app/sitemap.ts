import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/config/seo-config";
import { OPEN_ROUTES } from "@/constants/routes";

/**
 * CHỈ liệt kê route trong (public) và chỉ nhóm OPEN_ROUTES.
 * Không đưa /signin, /signup vào — trang auth đã noindex, quảng cáo nó với Google
 * là mâu thuẫn tín hiệu.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return OPEN_ROUTES.map((route) => ({
    url: `${SEO_CONFIG.url}${route}`,
    lastModified: now,
    // Landing page là cửa vào chính; trang pháp lý đổi hiếm và ít quan trọng hơn
    changeFrequency: route === "/" ? ("weekly" as const) : ("monthly" as const),
    priority: route === "/" ? 1 : 0.5,
  }));
}
