"use client";

import { useEffect, useRef } from "react";
import { Brain, User } from "lucide-react";

function formatMarkdown(text: string) {
  const paragraphs = text.split("\n\n");
  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split("\n");
    return (
      <div key={pIdx} className="space-y-1.5">
        {lines.map((line, lIdx) => {
          const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          const cleanLine = isBullet ? line.trim().substring(2) : line;

          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
          const renderedLine = parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <p className="leading-relaxed">{renderedLine}</p>
              </div>
            );
          }

          return (
            <p key={lIdx} className="leading-relaxed">
              {renderedLine}
            </p>
          );
        })}
      </div>
    );
  });
}

export default function ChatMessageList({
  messages,
  isLoading,
}: {
  messages: IChatMessage[];
  isLoading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
      {messages.map((msg, index) => {
        const isAssistant = msg.role === "assistant" || msg.role === "system";
        return (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              isAssistant ? "justify-start" : "flex-row-reverse justify-start"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xs font-semibold shadow-xs ${
                isAssistant
                  ? "bg-primary/10 text-primary"
                  : "bg-gradient-to-tr from-primary to-sky-400 text-white"
              }`}
            >
              {isAssistant ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-3xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                isAssistant
                  ? "liquid-glass text-foreground-secondary"
                  : "bg-primary text-white"
              }`}
            >
              {isAssistant ? formatMarkdown(msg.content) : <p>{msg.content}</p>}
            </div>
          </div>
        );
      })}

      {isLoading ? (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Brain className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 rounded-3xl liquid-glass px-4 py-3 text-xs text-foreground-muted shadow-sm">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span className="ml-1 italic">AI đang đọc tài liệu và phản hồi…</span>
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
