import type { MetadataRoute } from "next";
import { SEO_CONFIG } from "@/config/seo-config";
import { OPEN_ROUTES, ROUTES } from "@/constants/routes";

/**
 * CHỈ liệt kê route trong (public) và chỉ nhóm OPEN_ROUTES.
 * Không đưa /signin, /signup vào — trang auth đã noindex, quảng cáo nó với Google
 * là mâu thuẫn tín hiệu.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Trang chủ và màn tính năng là hai cửa vào chính; trang pháp lý đổi hiếm và ít
  // quan trọng hơn. Sau khi hoán đổi route, "/tinh-nang" cũng là nội dung chính chứ
  // không còn là trang phụ — xếp nó chung nhóm ưu tiên cao thay vì bỏ về 0.5.
  const PRIMARY: string[] = [ROUTES.HOME, ROUTES.FEATURE];

  return OPEN_ROUTES.map((route) => {
    const primary = PRIMARY.includes(route);
    return {
      url: `${SEO_CONFIG.url}${route}`,
      lastModified: now,
      changeFrequency: primary ? ("weekly" as const) : ("monthly" as const),
      priority: route === ROUTES.HOME ? 1 : primary ? 0.9 : 0.5,
    };
  });
}
