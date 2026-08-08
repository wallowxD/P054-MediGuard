import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import { SEO_CONFIG } from "@/config/seo-config";
import StoreProvider from "@/store/StoreProvider";
import "./globals.css";
import { NextAuthProvider } from "./lib/next.auth.provider";
import { QueryProvider } from "./lib/query.provider";

// Lora cho tiêu đề (`font-heading`) — serif editorial, vẫn phủ đủ dấu tiếng Việt.
// Inter cho phần thân (`--font-sans` mặc định) — dễ đọc ở cỡ nhỏ, vẫn phủ đủ dấu.
const headingFont = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-app",
});

const bodyFont = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(SEO_CONFIG.url),
  title: { default: SEO_CONFIG.appName, template: `%s | ${SEO_CONFIG.shortName}` },
  description: SEO_CONFIG.description,
  keywords: [...SEO_CONFIG.keywords],
};

// Thứ tự provider: Store → Query → NextAuth.
// NextAuth trong cùng vì `utils/request.ts` gọi getSession() trong interceptor,
// mà interceptor đó được React Query kích hoạt.
// Đọc lựa chọn theme đã lưu trước khi React hydrate để tránh nháy màu sai lúc tải
// trang. Không có lựa chọn thì để CSS media query (`:root:not(.light)` trong
// globals.css) tự quyết theo system preference — script chỉ cần thêm class khi có
// lựa chọn tường minh. Landing page dùng `.landing-theme` để ép sáng, không đọc
// class này nên không bị ảnh hưởng.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("medsafe-theme");if(t==="dark"){document.documentElement.classList.add("dark");}else if(t==="light"){document.documentElement.classList.add("light");}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${headingFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <StoreProvider>
          <QueryProvider>
            <NextAuthProvider>
              {children}
              <ToastProvider />
            </NextAuthProvider>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
