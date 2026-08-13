"use client";

import { useEffect, useRef } from "react";
import { Brain, User } from "lucide-react";

function formatMarkdown(text: string) {
  // Simple markdown renderer for bold, lists, and line breaks
  const paragraphs = text.split("\n\n");
  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split("\n");
    return (
      <div key={pIdx} className="space-y-1.5">
        {lines.map((line, lIdx) => {
          const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
          const cleanLine = isBullet ? line.trim().substring(2) : line;

          // Replace **bold** with <strong>
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
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-semibold text-xs ${
                isAssistant
                  ? "bg-hero-tint border border-primary/20 text-primary"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isAssistant ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                isAssistant
                  ? "border border-border bg-card text-foreground-secondary"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isAssistant ? formatMarkdown(msg.content) : <p className="leading-relaxed">{msg.content}</p>}
            </div>
          </div>
        );
      })}

      {isLoading ? (
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-hero-tint text-primary">
            <Brain className="h-4 w-4 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground-muted">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
            <span className="ml-1 text-xs italic">AI đang đọc dữ liệu & phản hồi...</span>
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
