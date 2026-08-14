import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-4xl font-semibold text-foreground">404</p>
      <p className="text-sm text-foreground-secondary">Không tìm thấy trang này.</p>
      {/* Trỏ "/" chứ không trỏ /dashboard: 404 hay rơi vào khách chưa đăng nhập, mà
          /dashboard là route bị chặn nên họ sẽ bị đá tiếp sang /signin — hai lần
          chuyển hướng cho một cú bấm. "/" giờ là trang chủ Vinmec công khai, hợp cho
          cả khách lẫn người đã đăng nhập. */}
      <Link href={ROUTES.HOME} className="mt-2 text-sm text-primary hover:text-primary-hover">
        Về trang chủ
      </Link>
    </main>
  );
}
