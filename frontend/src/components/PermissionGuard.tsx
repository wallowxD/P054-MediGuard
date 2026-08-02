"use client";

import { useSession } from "next-auth/react";

interface PermissionGuardProps {
  /** Cần MỘT trong các role này */
  roles: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Phân quyền mịn ở mức component — dùng khi số role vượt quá 2 tầng route group.
 * Đừng biểu diễn ma trận quyền bằng cấu trúc thư mục.
 *
 * ⚠️ Đây chỉ là UX (giấu nút). Backend vẫn phải enforce quyền cho mọi endpoint.
 */
export default function PermissionGuard({
  roles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { data: session } = useSession();
  const userRoles = session?.user?.roles ?? [];
  const allowed = roles.some((r) => userRoles.includes(r));

  return <>{allowed ? children : fallback}</>;
}
