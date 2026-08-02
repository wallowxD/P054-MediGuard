import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import { SEO_CONFIG } from "@/config/seo-config";
import StoreProvider from "@/store/StoreProvider";
import "./globals.css";
import { NextAuthProvider } from "./lib/next.auth.provider";
import { QueryProvider } from "./lib/query.provider";

const font = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-app",
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
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
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
