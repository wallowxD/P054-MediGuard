"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useChat } from "@/context/ChatContext";
import DoctorAvatar from "./DoctorAvatar";

/**
 * Câu mời hỏi xoay vòng trong bong bóng trên đầu bác sĩ — cố định, không sinh bằng model.
 * Chỉ mời đặt câu hỏi, không hứa tư vấn lâm sàng (nguyên tắc an toàn số 2 trong AGENTS.md).
 */
const IDLE_MESSAGES = [
  "Bạn có thể hỏi tôi về thuốc đang tra cứu",
  "Tôi trả lời kèm trích dẫn từ tờ HDSD",
  "Thuốc này nên tránh ăn uống gì?",
  "Có thắc mắc gì cứ bấm vào tôi nhé",
];

/** Khi đã có kết quả tra cứu thì đổi sang bộ câu nhắc thẳng vào lượt tra cứu đó. */
const RESULT_MESSAGES = [
  "Cần tôi giải thích kết quả vừa tra cứu?",
  "Hỏi tôi vì sao cặp thuốc này bị cảnh báo",
  "Tôi trả lời kèm trích dẫn từ tờ HDSD",
];

/** Ba chấm giữ 3.5s, mỗi câu chữ giữ 11s → khoảng 15s mới đổi sang câu kế tiếp. */
const THINKING_MS = 3500;
const MESSAGE_MS = 11000;

/**
 * Nút bác sĩ nổi ở góc phải màn hình — lối vào duy nhất của trợ lý AI.
 *
 * Một lần bấm là panel chat mở ra kèm ngữ cảnh của lượt tra cứu đang xem: trang kết quả
 * chỉ đăng ký ngữ cảnh qua `registerResult`, không còn nút "Hỏi thêm AI" trung gian.
 */
export default function ChatFab() {
  const { isOpen, activeResult, resultVersion, openChat } = useChat();

  // Bước chẵn hiện ba chấm "đang nghĩ", bước lẻ hiện một câu mời hỏi.
  const [step, setStep] = useState(0);
  const isThinking = step % 2 === 0;
  const messages = activeResult ? RESULT_MESSAGES : IDLE_MESSAGES;
  const message = messages[Math.floor(step / 2) % messages.length];

  useEffect(() => {
    const delay = step % 2 === 0 ? THINKING_MS : MESSAGE_MS;
    const timer = window.setTimeout(() => setStep((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [step]);

  return (
    // `pointer-events-none` ở wrapper vì bong bóng rộng hơn nút nhiều; không có nó thì
    // vùng trong suốt quanh bong bóng sẽ nuốt click của nội dung phía dưới.
    <div
      className={`pointer-events-none fixed bottom-20 right-4 z-40 flex flex-col items-end transition-all duration-300 lg:bottom-6 lg:right-6 ${
        isOpen ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {/* Bong bóng neo theo cạnh phải nên câu dài nở sang trái, không tràn khỏi màn hình.
          Khoảng `mb-5` chừa chỗ cho hai chấm đuôi nối xuống đầu bác sĩ. */}
      <div aria-hidden className="relative mb-5 mr-2">
        <div className="chat-fab-think">
          <div
            key={step}
            className="chat-fab-bubble max-w-52 rounded-2xl border border-border bg-card px-3 py-2 text-xs font-medium leading-5 text-foreground shadow-lg"
          >
            {isThinking ? (
              <span className="flex items-center gap-1 py-1.5">
                <span className="chat-fab-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="chat-fab-dot h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="chat-fab-dot h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
            ) : (
              message
            )}
          </div>
        </div>

        <span className="chat-fab-think-tail absolute right-3 top-full mt-1 h-2 w-2 rounded-full border border-border bg-card" />
        <span className="chat-fab-think-tail absolute right-7 top-full mt-3 h-1.5 w-1.5 rounded-full border border-border bg-card" />
      </div>

      <button
        type="button"
        onClick={openChat}
        aria-label="Mở trợ lý AI tra cứu"
        title="Hỏi trợ lý AI về lượt tra cứu"
        className="group pointer-events-auto relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-hero-tint shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-95 lg:h-24 lg:w-24"
      >
        {activeResult ? (
          <span
            key={resultVersion}
            aria-hidden
            className="chat-fab-ping absolute inset-0 rounded-full bg-primary/25"
          />
        ) : null}

        <DoctorAvatar className="h-full w-full" />

        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-sm ring-2 ring-background"
        >
          <Sparkles className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}
