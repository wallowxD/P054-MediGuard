import Link from "next/link";
import { SEO_CONFIG } from "@/config/seo-config";
import Logo from "@/components/ui/Logo";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import Reveal from "./Reveal";

const PRODUCT_LINKS = [
  { href: LANDING_SECTIONS.FEATURES, label: "Tra tương tác thuốc" },
  { href: LANDING_SECTIONS.FEATURES, label: "Tra thông tin thuốc" },
  { href: ROUTES.SIGNIN, label: "Lịch sử tra cứu" },
];

const SUPPORT_LINKS = [
  { href: "/terms-of-service", label: "Điều khoản sử dụng" },
  { href: "/privacy-policy", label: "Chính sách bảo mật" },
];

// `id` của footer phải khớp LANDING_SECTIONS.CONTACT — mục nav "Liên hệ" neo tới đây.
export default function LandingFooter() {
  return (
    <footer
      id={LANDING_SECTIONS.CONTACT.slice(1)}
      className="landing-footer-wash scroll-mt-20 border-t border-border"
    >
      <Reveal className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 text-primary">
              <Logo className="h-8 w-auto" />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-foreground-secondary">
              Sản phẩm mô phỏng phục vụ học tập và demo, không thay thế tư vấn hoặc chỉ
              định y khoa.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-foreground-secondary">
              Bạn không chắc về kết quả? Hỏi dược sĩ/bác sĩ điều trị.
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Sản phẩm</h3>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-sm py-1 text-sm text-foreground-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">Hỗ trợ</h3>
            <ul className="mt-4 space-y-3">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-sm py-1 text-sm text-foreground-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-7">
          <p className="text-sm text-foreground-muted">
            © {new Date().getFullYear()} {SEO_CONFIG.brandName} · Cuvée Tech — P-054
          </p>
        </div>
      </Reveal>
    </footer>
  );
}
