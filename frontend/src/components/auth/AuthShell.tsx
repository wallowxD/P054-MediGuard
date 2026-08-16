import { FileCheck2, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";
import { ROUTES } from "@/constants/routes";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const TRUST_POINTS = [
  {
    Icon: FileCheck2,
    title: "Dẫn nguồn nguyên văn",
    description: "Mọi cảnh báo tương tác đều đi kèm trích dẫn chính thức từ tờ HDSD.",
  },
  {
    Icon: UserRoundCheck,
    title: "Dược sĩ đối chiếu song song",
    description: "Hệ thống chuẩn y khoa được giám sát bởi đội ngũ chuyên gia Vinmec.",
  },
] as const;

export default function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main
      id={MAIN_CONTENT_ID}
      tabIndex={-1}
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background p-4 sm:p-6 lg:p-10"
    >
      {/* Ambient background lighting */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl rounded-3xl liquid-glass p-4 sm:p-8 lg:p-12 shadow-2xl">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left Brand Showcase */}
          <div className="space-y-6 lg:col-span-6 lg:pr-8">
            <Link
              href={ROUTES.HOME}
              aria-label="Quay về trang chủ Vinmec"
              className="inline-block transition-opacity hover:opacity-85"
            >
              <Logo className="h-10 w-auto" />
            </Link>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Trợ lý An toàn Thuốc AI</span>
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Hiểu rõ hơn về thuốc bạn đang sử dụng.
              </h2>
              <p className="text-sm leading-relaxed text-foreground-secondary">
                Tra cứu tương tác thuốc và bệnh nền với dữ liệu có nguồn kiểm chứng, hỗ trợ bạn chăm sóc sức khỏe an toàn mỗi ngày.
              </p>
            </div>

            <div className="grid gap-3 pt-2">
              {TRUST_POINTS.map(({ Icon, title: pointTitle, description: pointDescription }) => (
                <div key={pointTitle} className="flex items-start gap-3 rounded-2xl liquid-glass-subtle p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{pointTitle}</p>
                    <p className="text-[11px] leading-relaxed text-foreground-secondary">{pointDescription}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-foreground-muted">
              Hệ thống tra cứu an toàn thuốc chỉ mang tính tham khảo y khoa, không thay thế chỉ định trực tiếp từ bác sĩ điều trị.
            </p>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl liquid-glass-strong p-6 sm:p-8 shadow-xl">
              <div className="mb-6 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
                <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
                <p className="text-xs text-foreground-secondary">{description}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
