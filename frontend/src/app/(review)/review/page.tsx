import Link from "next/link";
import { ROUTES } from "@/constants/routes";

export default function ReviewHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Khu duyệt của dược sĩ</h1>
      <p className="text-sm text-foreground-secondary">
        Duyệt song song, không chặn luồng người dùng. Cảnh báo chờ duyệt vẫn hiển thị
        đầy đủ kèm nhãn “chờ xác nhận chuyên môn”.
      </p>
      <Link
        href={ROUTES.REVIEW_QUEUE}
        className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
      >
        Vào hàng đợi
      </Link>
    </div>
  );
}
