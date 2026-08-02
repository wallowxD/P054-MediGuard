import Link from "next/link";
import { SEO_CONFIG } from "@/config/seo-config";
import Logo from "@/components/ui/Logo";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";

const PRODUCT_LINKS = [
  { href: LANDING_SECTIONS.FEATURES, label: "Tra tương tác thuốc" },
  { href: LANDING_SECTIONS.FEATURES, label: "Tra thông tin thuốc" },
  { href: ROUTES.SIGNIN, label: "Lịch sử tra cứu" },
];

const SUPPORT_LINKS = [
  { href: "/terms-of-service", label: "Điều khoản sử dụng" },
  { href: "/privacy-policy", label: "Chính sách bảo mật" },
  { href: LANDING_SECTIONS.SAFETY, label: "An toàn sử dụng" },
];

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background-elevated">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 text-primary">
              <Logo className="h-8 w-8" />
              <span className="text-[15px] font-semibold text-foreground">
                {SEO_CONFIG.brandName}
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground-secondary">
              Sản phẩm mô phỏng phục vụ học tập và demo, không thay thế tư vấn hoặc chỉ
              định y khoa.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Sản phẩm</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground-secondary transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Hỗ trợ</h3>
            <ul className="mt-4 space-y-3">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-foreground-secondary transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6">
          <p className="text-xs text-foreground-muted">
            © {new Date().getFullYear()} {SEO_CONFIG.brandName} · Cuvée Tech — P-054
          </p>
        </div>
      </div>
    </footer>
  );
}
