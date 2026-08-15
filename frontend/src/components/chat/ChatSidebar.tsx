"use client";

import { MessageSquare, ShieldAlert, X } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import ChatMessageInput from "./ChatMessageInput";
import ChatMessageList from "./ChatMessageList";
import DoctorAvatar from "./DoctorAvatar";

// Panel chat. Cửa mở panel là `ChatFab` (nút bác sĩ nổi góc phải) — ở đây cố tình
// không có thêm nút toggle nào để chỉ còn một lối vào duy nhất.
export default function ChatSidebar() {
  const { isOpen, contextSummary, messages, quickSuggestions, isLoading, closeChat, sendMessage } =
    useChat();

  return (
    <>
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
            <DoctorAvatar className="h-11 w-11 shrink-0 border border-primary/20 bg-hero-tint shadow-xs" />
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

          <button
            onClick={closeChat}
            className="rounded-lg p-2 text-foreground-muted hover:bg-background hover:text-foreground"
            title="Đóng chat"
            aria-label="Đóng chat"
          >
            <X className="h-5 w-5" />
          </button>
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
