import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-semibold text-foreground">404</p>
      <p className="text-sm text-foreground-secondary">Không tìm thấy trang này.</p>
      <Link
        href={ROUTES.DASHBOARD}
        className="mt-2 text-sm text-primary hover:text-primary-hover"
      >
        Về trang tổng quan
      </Link>
    </main>
  );
}
