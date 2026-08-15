"use client";

import React, { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ChatMessageInput({
  suggestions,
  onSend,
  disabled,
}: {
  suggestions: string[];
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/60 p-3 sm:p-4 space-y-3">
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSend(suggestion)}
              className="flex items-center gap-1.5 rounded-full liquid-glass-pill px-3 py-1 text-[11px] font-semibold text-primary transition-all hover:scale-105 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        <textarea
          rows={2}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Đặt câu hỏi cho trợ lý AI... (Enter để gửi)"
          className="flex-1 resize-none rounded-2xl liquid-glass-input p-3 text-xs sm:text-sm text-foreground placeholder:text-foreground-muted outline-none disabled:opacity-50"
        />
        <Button
          variant="solid"
          size="sm"
          disabled={!text.trim() || disabled}
          onClick={handleSend}
          className="shrink-0 h-10 w-10 rounded-full p-0 flex items-center justify-center shadow-md"
        >
          <ArrowUp className="h-4 w-4" />
          <span className="sr-only">Gửi câu hỏi</span>
        </Button>
      </div>
    </div>
  );
}
