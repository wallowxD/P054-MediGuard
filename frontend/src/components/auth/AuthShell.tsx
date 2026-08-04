import { FileCheck2, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/ui/Logo";
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
    title: "Bằng chứng nguyên văn",
    description: "Mỗi cảnh báo đều đi kèm trích dẫn và nguồn để bạn kiểm tra.",
  },
  {
    Icon: UserRoundCheck,
    title: "Dược sĩ xác nhận song song",
    description: "Trạng thái chuyên môn luôn được thể hiện rõ ràng và minh bạch.",
  },
] as const;

export default function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="grid min-h-[100dvh] bg-background lg:grid-cols-[minmax(0,0.9fr)_minmax(30rem,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-hero-tint px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16">
        <div
          aria-hidden
          className="landing-hero-texture pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-30"
        />

        <Link
          href={ROUTES.HOME}
          aria-label="Quay về trang chủ MediGuard"
          className="relative inline-flex w-fit items-center gap-3 rounded-full text-primary transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-hero-tint"
        >
          <Logo className="h-10 w-10" />
          <span className="text-lg font-semibold tracking-tight">MediGuard</span>
        </Link>

        <div className="relative max-w-xl py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Trợ lý an toàn thuốc
          </div>
          <h2 className="mt-7 max-w-lg font-heading text-4xl font-semibold leading-tight text-foreground xl:text-5xl">
            Hiểu rõ hơn về thuốc bạn đang sử dụng.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-foreground-secondary">
            Tra cứu tương tác thuốc với thông tin tham khảo có nguồn, được thiết kế để bạn
            luôn biết dữ liệu đến từ đâu.
          </p>

          <div className="mt-10 grid gap-4">
            {TRUST_POINTS.map(({ Icon, title: pointTitle, description: pointDescription }) => (
              <div key={pointTitle} className="flex max-w-lg gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-primary shadow-sm shadow-primary/10">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{pointTitle}</p>
                  <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                    {pointDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative max-w-md text-xs leading-5 text-foreground-muted">
          Thông tin trên MediGuard chỉ mang tính tham khảo và không thay thế đánh giá của
          bác sĩ hoặc dược sĩ.
        </p>
      </aside>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href={ROUTES.HOME}
            aria-label="Quay về trang chủ MediGuard"
            className="mb-10 inline-flex items-center gap-3 text-primary transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 lg:hidden"
          >
            <Logo className="h-10 w-10" />
            <span className="text-lg font-semibold tracking-tight">MediGuard</span>
          </Link>

          <div className="rounded-[2rem] bg-surface p-1.5 shadow-2xl shadow-primary/10">
            <div className="rounded-[calc(2rem-0.375rem)] border border-border bg-card px-5 py-7 sm:px-8 sm:py-9">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground-muted">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-foreground-secondary">{description}</p>
              <div className="mt-8">{children}</div>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-sm text-center text-xs leading-5 text-foreground-muted lg:hidden">
            Thông tin chỉ mang tính tham khảo, không thay thế đánh giá của bác sĩ hoặc dược
            sĩ.
          </p>
        </div>
      </section>
    </main>
  );
}
