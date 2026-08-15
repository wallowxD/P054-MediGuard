"use client";

import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import AppSidebar from "@/components/navigation/AppSidebar";
import { BottomNav } from "@/components/navigation/BottomNav";
import MobileTopbar from "@/components/navigation/MobileTopbar";
import { useSidebarCollapsed } from "@/components/navigation/use-sidebar-collapsed";

import { ChatFab, ChatSidebar } from "@/components/chat";
import { ChatProvider } from "@/context/ChatContext";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <ChatProvider>
      <div className="relative min-h-screen bg-background text-foreground">
        {/* Ambient Apple Lighting Layers */}
        <div className="ambient-glow-mesh" aria-hidden>
          <div className="ambient-blob-1" />
          <div className="ambient-blob-2" />
          <div className="ambient-blob-3" />
        </div>

        <div
          className={`relative z-10 min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            collapsed ? "lg:pl-20" : "lg:pl-72"
          }`}
        >
          <MobileTopbar />
          <AppSidebar />
          <main className="mx-auto max-w-6xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-12">
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
      </div>
    </ChatProvider>
  );
}
