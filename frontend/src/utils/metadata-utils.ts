import type { Metadata } from "next";
import { SEO_CONFIG } from "@/config/seo-config";

/** Metadata cho trang trong (public) — cho phép index */
export const buildPublicMetadata = (
  title: string,
  description: string = SEO_CONFIG.description,
  path: string = "/"
): Metadata => ({
  title,
  description,
  alternates: { canonical: path },
  openGraph: {
    title: `${title} | ${SEO_CONFIG.appName}`,
    description,
    url: `${SEO_CONFIG.url}${path}`,
    siteName: SEO_CONFIG.appName,
    locale: SEO_CONFIG.locale,
    type: "website",
  },
});

/**
 * Metadata cho trang sau đăng nhập hoặc trang auth — chặn index.
 * Dữ liệu sau đăng nhập không được để Google bò vào.
 */
export const buildPrivateMetadata = (title: string, description?: string): Metadata => ({
  title,
  description,
  robots: { index: false, follow: false },
});
