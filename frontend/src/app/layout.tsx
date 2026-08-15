import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import { SEO_CONFIG } from "@/config/seo-config";
import StoreProvider from "@/store/StoreProvider";
import "./globals.css";
import { NextAuthProvider } from "./lib/next.auth.provider";
import { QueryProvider } from "./lib/query.provider";

/**
 * ★ MỘT font cho toàn site: Inter. Tiêu đề và thân bài dùng chung, không có font
 *   serif cho heading và không có display font riêng cho hero.
 *
 * Đây là cách trang chủ Vinmec làm — CSS gốc của họ đặt
 * `html, body { font-family: "Inter", ... }` và không khai báo font nào khác cho
 * `h1…h6`. Muốn giao diện khớp Vinmec thì phải khớp cả điểm này.
 *
 * Không truyền `weight`: Inter được nạp ở dạng variable font nên có sẵn dải
 * 100–900, đúng như Vinmec nạp (`family=Inter:wght@100..900`). Thêm một weight mới
 * trong code không phải khai báo lại ở đây.
 *
 * `fallback` chép theo đúng thứ tự dự phòng của Vinmec, để lúc font chưa tải xong
 * chữ không nhảy sang một font hệ thống khác hẳn.
 *
 * Chi tiết quy tắc dùng font: docs/frontend.md § Typography.
 */
const interFont = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-body",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
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
      className={`${interFont.variable} h-full antialiased`}
      // `THEME_INIT_SCRIPT` thêm class `light`/`dark` vào chính thẻ <html> này
      // trước khi React hydrate, nên className trong DOM luôn khác className mà
      // server render ra. Đây là lệch cố ý, không phải bug: nếu để server render
      // sẵn class theo theme thì phải biết localStorage lúc SSR, điều không thể.
      // Cờ này chỉ tắt cảnh báo cho riêng thẻ <html>, con của nó vẫn được đối chiếu.
      suppressHydrationWarning
    >
      {/*
        Extension trình duyệt hay chèn attribute vào <body> trước khi React hydrate:
        ColorZilla thêm `cz-shortcut-listen`, Grammarly thêm `data-gr-ext-installed`.
        Máy nào cài thì máy đó thấy overlay lỗi hydration, dù code hoàn toàn đúng.
        Tắt cảnh báo ở đây an toàn vì <body> chỉ có className tĩnh, không có attribute
        nào phụ thuộc dữ liệu để mà lệch thật. Nếu sau này cần gắn attribute động vào
        <body>, phải bỏ cờ này ra, không thì lệch thật cũng bị giấu luôn.
      */}
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
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
