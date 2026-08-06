"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReviewHeader } from "@/components/header/review.header";
import LoadingOverlay from "@/components/LoadingOverlay";
import { ROLES, ROUTES } from "@/constants/routes";

/**
 * LỚP PHÒNG THỦ THỨ HAI. Proxy đã chặn ở edge rồi (xem src/proxy.ts).
 * Layout này chỉ để dự phòng khi matcher đổi hoặc route mới quên khai báo.
 * Đừng coi đây là cơ chế chặn chính — lúc nó chạy thì bundle đã về tới client.
 */
export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isPharmacist = session?.user?.roles?.includes(ROLES.PHARMACIST);

  useEffect(() => {
    if (status === "authenticated" && !isPharmacist) router.push(ROUTES.DASHBOARD);
  }, [status, isPharmacist, router]);

  if (status === "authenticated" && !isPharmacist) return null;

  return (
    <LoadingOverlay>
      <div className="min-h-screen bg-background text-foreground">
        <ReviewHeader />
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
    </LoadingOverlay>
  );
}
