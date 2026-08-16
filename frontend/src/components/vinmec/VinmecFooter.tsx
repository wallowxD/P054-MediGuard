import Image from "next/image";
import Link from "next/link";
import {
  VINMEC_COPYRIGHT,
  VINMEC_FOOTER_NAV,
} from "./vinmec-content";

export default function VinmecFooter() {
  return (
    <footer className="w-full relative mt-16 border-t border-border/60 bg-surface/30 backdrop-blur-md py-8 text-foreground transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 space-y-6">
        {/* Top Tier: Logo & Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Link href="/" className="transition-opacity hover:opacity-90">
              <Image
                src="/images/vinmec/logo-vinmec-system.png"
                alt="Vinmec Healthcare System"
                width={456}
                height={282}
                className="vinmec-brand-logo h-8 sm:h-9 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline text-border">•</span>
            <span className="text-xs text-foreground-muted">
              Hệ thống Y tế Vinmec · Trợ lý An toàn Thuốc AI (MedSafe)
            </span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-foreground-secondary">
            {VINMEC_FOOTER_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Tier: Copyright & Legal Badges */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-[11px] text-foreground-muted">
          <p className="text-center sm:text-left">{VINMEC_COPYRIGHT}</p>
          <div className="flex items-center gap-3">
            <div className="rounded bg-white/80 border border-border/50 px-1.5 py-0.5">
              <Image
                src="/images/vinmec/badge-bocongthuong.svg"
                alt="Bộ Công Thương"
                width={100}
                height={32}
                className="h-5 w-auto object-contain"
              />
            </div>
            <div className="rounded bg-white/80 border border-border/50 px-1.5 py-0.5">
              <Image
                src="/images/vinmec/badge-dmca.png"
                alt="DMCA Protected"
                width={80}
                height={16}
                className="h-4 w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}





