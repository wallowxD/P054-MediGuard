"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/header/app.header";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BottomNav } from "@/components/navigation/BottomNav";

// Middleware lo phần auth — vào được đây nghĩa là đã đăng nhập.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl p-4 pb-20 sm:p-6 lg:pb-6">
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
