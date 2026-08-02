import type { NextConfig } from "next";
import { API_BASE_URL } from "./src/constants/api";

const nextConfig: NextConfig = {
  // Gói server + chỉ những dependency thực sự dùng vào .next/standalone,
  // để image Docker không phải mang theo toàn bộ node_modules.
  // Xem frontend/Dockerfile (stage runner copy đúng thư mục này).
  output: "standalone",

  images: {
    // Thêm host vào đây khi thực sự cần load ảnh ngoài (ví dụ avatar OAuth).
    // Cố tình để rỗng: mỗi entry là một lỗ trong allowlist của image optimizer.
    remotePatterns: [],
  },

  compress: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },

  async rewrites() {
    if (!API_BASE_URL) return [];
    return [{ source: "/api/external/:path*", destination: `${API_BASE_URL}/:path*` }];
  },
};

export default nextConfig;
