"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useChat } from "@/context/ChatContext";
import DoctorAvatar from "./DoctorAvatar";

const IDLE_MESSAGES = [
  "Chưa tra cứu gì cũng hỏi tôi được nhé",
  "Tôi hướng dẫn bạn dùng hệ thống",
  "Tôi trả lời kèm trích dẫn từ tờ HDSD",
  "Có thắc mắc gì cứ bấm vào tôi nhé",
];

const RESULT_MESSAGES = [
  "Cần tôi giải thích kết quả vừa tra cứu?",
  "Hỏi tôi vì sao cặp thuốc này bị cảnh báo",
  "Tôi trả lời kèm trích dẫn từ tờ HDSD",
];

const DRUG_MESSAGES = [
  "Cần tôi giải thích tờ HDSD này?",
  "Hỏi tôi thuốc này chống chỉ định với ai",
  "Tôi trích nguyên văn từ tài liệu gốc",
];

const THINKING_MS = 3500;
const MESSAGE_MS = 11000;

export default function ChatFab() {
  const { isOpen, activeDrug, activeResult, resultVersion, openChat } = useChat();

  const [step, setStep] = useState(0);
  const isThinking = step % 2 === 0;
  // Cùng thứ tự ưu tiên ngữ cảnh với `openChat()` — lời mời phải khớp thứ sẽ mở ra.
  const messages = activeDrug ? DRUG_MESSAGES : activeResult ? RESULT_MESSAGES : IDLE_MESSAGES;
  const message = messages[Math.floor(step / 2) % messages.length];

  useEffect(() => {
    const delay = step % 2 === 0 ? THINKING_MS : MESSAGE_MS;
    const timer = window.setTimeout(() => setStep((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [step]);

  return (
    <div
      className={`pointer-events-none fixed bottom-20 right-4 z-40 flex flex-col items-end transition-all duration-300 lg:bottom-6 lg:right-6 ${
        isOpen ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {/* Speech Bubble */}
      <div aria-hidden className="relative mb-4 mr-2">
        <div className="chat-fab-think">
          <div
            key={step}
            className="chat-fab-bubble max-w-56 rounded-3xl liquid-glass px-4 py-2.5 text-xs font-semibold leading-relaxed text-foreground shadow-2xl"
          >
            {isThinking ? (
              <span className="flex items-center gap-1.5 py-1">
                <span className="chat-fab-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="chat-fab-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="chat-fab-dot h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            ) : (
              message
            )}
          </div>
        </div>

        <span className="chat-fab-think-tail absolute right-4 top-full mt-1.5 h-2 w-2 rounded-full liquid-glass shadow-sm" />
        <span className="chat-fab-think-tail absolute right-7 top-full mt-3 h-1.5 w-1.5 rounded-full liquid-glass shadow-sm" />
      </div>

      {/* Floating Apple Intelligence Trigger Button */}
      <button
        type="button"
        onClick={openChat}
        aria-label="Mở trợ lý An toàn Thuốc AI"
        title="Hỏi trợ lý An toàn Thuốc AI"
        className="group pointer-events-auto relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full liquid-glass-bar shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 lg:h-22 lg:w-22"
      >
        {activeResult ? (
          <span
            key={resultVersion}
            aria-hidden
            className="chat-fab-ping absolute inset-0 rounded-full bg-primary/30 blur-xs"
          />
        ) : null}

        <DoctorAvatar className="h-full w-full" />

        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-sky-400 text-white shadow-md ring-2 ring-background"
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
