"use client";

import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AppSidebar from "@/components/navigation/AppSidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import MobileTopbar from "@/components/navigation/MobileTopbar";
import SkipLink, { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";

// Middleware lo phần auth — vào được đây nghĩa là đã đăng nhập.
// Desktop dùng AppSidebar cố định bên trái; mobile/tablet dùng MobileTopbar + drawer.
// Hai component không hiển thị cùng lúc (chia theo breakpoint `lg:`) nên không tạo
// navigation trùng lặp.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:pl-64">
      <SkipLink />
      <MobileTopbar />
      <AppSidebar />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-6xl p-4 pb-20 sm:p-6 lg:pb-6">
        <Suspense
          fallback={
            <div className="flex min-h-96 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
