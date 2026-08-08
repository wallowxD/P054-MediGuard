"use client";

import { Info } from "lucide-react";
import { useSession } from "next-auth/react";

/** Lời chào đầu trang chủ + dòng an toàn cố định — không được bỏ ở bất kỳ bản chỉnh sửa nào */
export default function WelcomeHero() {
  const { data: session } = useSession();
  const name = session?.user?.name || "bạn";

  return (
    <div className="space-y-3">
      <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
        Chào mừng trở lại, {name}
      </h1>
      <div className="inline-flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>Thông tin tham khảo, không thay thế đánh giá của bác sĩ.</span>
      </div>
    </div>
  );
}
