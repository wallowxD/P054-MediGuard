import { ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { VINMEC_CERTIFICATIONS } from "./vinmec-content";

export default function VinmecCertifications() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20" aria-label="Chứng nhận quốc tế">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl liquid-glass p-8 sm:p-12">
          {/* Ambient lighting overlay */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Tiêu chuẩn quốc tế</span>
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Chứng nhận & Kiểm định chất lượng toàn cầu
              </h2>
              <p className="text-sm leading-relaxed text-foreground-secondary sm:text-base">
                Vinmec tự hào là một trong số ít hệ thống y tế tại Việt Nam đạt chứng nhận vàng JCI,
                CAP và AABB, bảo chứng cho sự an toàn cao nhất trong từng quy trình chăm sóc.
              </p>
              <div className="pt-2">
                <Link
                  href={ROUTES.ABOUT}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
                >
                  <span>Tìm hiểu thêm về các chứng nhận của Vinmec</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Certifications Badges */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-3 gap-4">
                {VINMEC_CERTIFICATIONS.map((cert) => (
                  <div
                    key={cert.src}
                    className="logo-plate flex aspect-square items-center justify-center rounded-2xl liquid-glass-subtle p-3 transition-transform duration-300 hover:scale-105"
                  >
                    <Image
                      src={cert.src}
                      alt={cert.alt}
                      width={180}
                      height={140}
                      className="h-full w-full object-contain rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
