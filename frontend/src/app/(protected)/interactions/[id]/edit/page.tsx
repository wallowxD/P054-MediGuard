import Link from "next/link";
import { ROUTES } from "@/constants/routes";

/**
 * Sửa ghi chú của người dùng gắn với một cảnh báo.
 *
 * ⚠️ KHÔNG cho sửa nội dung cảnh báo, đoạn trích hay mức severity — đó là dữ liệu
 * có nguồn, chỉ dược sĩ mới được đụng và phải đi qua khu duyệt (/review).
 * TODO(API): nối khi backend có endpoint ghi chú.
 */
export default async function EditInteractionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-foreground">Ghi chú cá nhân</h1>
      <p className="text-sm text-foreground-secondary">
        Cảnh báo: <code className="text-foreground">{id}</code>
      </p>
      <p className="text-sm text-foreground-muted">
        Nội dung cảnh báo và đoạn trích không sửa được ở đây — chỉ dược sĩ duyệt được,
        qua khu duyệt.
      </p>
      <Link
        href={`${ROUTES.INTERACTIONS}/${id}`}
        className="inline-block text-sm text-primary hover:text-primary-hover"
      >
        Quay lại chi tiết
      </Link>
    </div>
  );
}
