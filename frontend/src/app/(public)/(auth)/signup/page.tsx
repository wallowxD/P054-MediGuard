import Link from "next/link";
import { ROUTES } from "@/constants/routes";

// TODO(API): dựng form đăng ký khi backend có POST /api/v1/auth/register.
// Hook sẵn: `useRegister()` trong src/queries/auth.ts
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold text-foreground">Đăng ký</h1>
        <p className="mt-2 text-sm text-foreground-secondary">
          Chức năng đăng ký sẽ mở khi backend có module auth.
        </p>
        <Link
          href={ROUTES.SIGNIN}
          className="mt-4 inline-block text-sm text-primary hover:text-primary-hover"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </main>
  );
}
