"use client";

import { Brain, ChevronRight, MessageSquare, ShieldAlert, X } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import ChatMessageInput from "./ChatMessageInput";
import ChatMessageList from "./ChatMessageList";

export default function ChatSidebar() {
  const {
    isOpen,
    contextSummary,
    messages,
    quickSuggestions,
    isLoading,
    closeChat,
    toggleChat,
    sendMessage,
  } = useChat();

  return (
    <>
      {/* Floating Toggle Button (visible when closed and context exists) */}
      {!isOpen && contextSummary ? (
        <button
          onClick={toggleChat}
          className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-2 rounded-l-2xl border border-r-0 border-primary/30 bg-card p-3 shadow-xl transition-transform hover:-translate-x-1 focus-visible:outline-none"
          title="Mở AI Trợ lý Tra cứu"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-hero-tint text-primary">
            <Brain className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          </div>
          <span className="hidden text-xs font-semibold text-foreground sm:inline">Hỏi AI</span>
        </button>
      ) : null}

      {/* Backdrop for mobile */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
          onClick={closeChat}
        />
      ) : null}

      {/* Right Sidebar Panel */}
      <aside
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:w-[420px] lg:w-[460px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Chatbot AI Trợ lý Tra cứu"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border bg-hero-tint-soft p-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hero-tint text-primary shadow-xs">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-base font-bold text-foreground">Trợ lý Tra cứu AI</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Live
                </span>
              </div>
              {contextSummary?.drugs.length ? (
                <p className="max-w-[240px] truncate text-xs text-foreground-secondary sm:max-w-[280px]">
                  {contextSummary.drugs.join(", ")}
                  {contextSummary.diseases.length
                    ? ` • ${contextSummary.diseases.join(", ")}`
                    : ""}
                </p>
              ) : (
                <p className="text-xs text-foreground-muted">Chưa nạp context tra cứu</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={closeChat}
              className="rounded-lg p-2 text-foreground-muted hover:bg-background hover:text-foreground"
              title="Ẩn Sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={closeChat}
              className="rounded-lg p-2 text-foreground-muted hover:bg-background hover:text-foreground"
              title="Đóng Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Safety Disclaimer Banner */}
        <div className="flex items-center gap-2 border-b border-border bg-warning/10 px-4 py-2 text-xs text-foreground-secondary">
          <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
          <span>Thông tin tham khảo từ nguồn HDSD; không thay thế chỉ định của bác sĩ.</span>
        </div>

        {/* Chat Messages Body */}
        {contextSummary ? (
          <ChatMessageList messages={messages} isLoading={isLoading} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <MessageSquare className="h-10 w-10 text-foreground-muted" />
            <p className="mt-3 font-medium text-foreground">Chưa có thông tin tra cứu</p>
            <p className="mt-1 text-xs text-foreground-muted">
              Hãy thực hiện tra cứu tương tác thuốc để khởi tạo Chatbot trợ lý.
            </p>
          </div>
        )}

        {/* Input Bar */}
        {contextSummary ? (
          <ChatMessageInput
            suggestions={quickSuggestions}
            onSend={sendMessage}
            disabled={isLoading}
          />
        ) : null}
      </aside>
    </>
  );
}
