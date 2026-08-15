"use client";

import { MessageSquare, ShieldAlert, Sparkles, X } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import ChatMessageInput from "./ChatMessageInput";
import ChatMessageList from "./ChatMessageList";
import DoctorAvatar from "./DoctorAvatar";

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

      {/* Right Apple Liquid Glass Sidebar Panel */}
      <aside
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col liquid-glass-strong border-l border-border/80 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[420px] lg:w-[460px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Chatbot AI Trợ lý Tra cứu"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border/60 p-4 sm:px-5">
          <div className="flex items-center gap-3">
            <DoctorAvatar className="h-11 w-11 shrink-0 rounded-2xl liquid-glass-subtle shadow-xs" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-sm font-bold text-foreground">Trợ lý Dược khoa AI</h2>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
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
                <p className="text-xs text-foreground-muted">Sẵn sàng giải đáp thắc mắc</p>
              )}
            </div>
          </div>

          <button
            onClick={closeChat}
            className="flex h-8 w-8 items-center justify-center rounded-full liquid-glass-pill text-foreground-muted hover:text-foreground transition-colors"
            title="Đóng chat"
            aria-label="Đóng chat"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Safety Disclaimer Banner */}
        <div className="flex items-center gap-2 border-b border-border/40 bg-amber-500/10 px-4 py-2 text-[11px] text-foreground-secondary">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>Thông tin trích dẫn từ tờ HDSD, không thay thế chỉ định của bác sĩ.</span>
        </div>

        {/* Chat Messages Body */}
        {contextSummary ? (
          <ChatMessageList messages={messages} isLoading={isLoading} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-heading text-sm font-bold text-foreground">Trợ lý AI sẵn sàng</p>
            <p className="mt-1 text-xs text-foreground-muted max-w-xs">
              Thực hiện tra cứu tương tác thuốc trên màn hình chính để nạp ngữ cảnh vào trợ lý.
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
