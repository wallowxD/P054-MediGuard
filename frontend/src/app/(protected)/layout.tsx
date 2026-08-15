"use client";

import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AppSidebar from "@/components/navigation/AppSidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import MobileTopbar from "@/components/navigation/MobileTopbar";
import { useSidebarCollapsed } from "@/components/navigation/use-sidebar-collapsed";
import SkipLink, { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";

import { ChatFab, ChatSidebar } from "@/components/chat";
import { ChatProvider } from "@/context/ChatContext";

// Middleware lo phần auth — vào được đây nghĩa là đã đăng nhập.
// Desktop dùng AppSidebar cố định bên trái; mobile/tablet dùng MobileTopbar + drawer.
// Hai component không hiển thị cùng lúc (chia theo breakpoint `lg:`) nên không tạo
// navigation trùng lặp.
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Padding trái đọc cùng nguồn với AppSidebar, nên nội dung chính tự nở ra khi sidebar
  // thu gọn thay vì để lại một dải trống 16rem.
  const { collapsed } = useSidebarCollapsed();

  return (
    <ChatProvider>
      <div
        className={`min-h-screen bg-background text-foreground transition-[padding] duration-200 ease-out ${
          collapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        <MobileTopbar />
        <AppSidebar />
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
        <ChatFab />
        <ChatSidebar />
      </div>
    </ChatProvider>
  );
}
