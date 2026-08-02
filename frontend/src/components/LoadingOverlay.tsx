"use client";

import { useSession } from "next-auth/react";
import LoadingSpinner from "./LoadingSpinner";

/** Che nội dung khi session chưa resolve xong, tránh nháy UI lúc hydrate. */
export default function LoadingOverlay({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
