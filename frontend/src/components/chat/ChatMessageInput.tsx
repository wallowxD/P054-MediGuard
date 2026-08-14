"use client";

import React, { useState } from "react";
import { Send, Sparkles } from "lucide-react";
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
    <div className="border-t border-border bg-card p-3 sm:p-4 space-y-3">
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSend(suggestion)}
              className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-hero-tint-soft px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {suggestion}
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
          placeholder="Đặt câu hỏi về lượt tra cứu này... (Shift+Enter để xuống dòng)"
          className="flex-1 resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <Button
          size="md"
          disabled={!text.trim() || disabled}
          onClick={handleSend}
          className="shrink-0 h-11 w-11 rounded-xl p-0 flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Gửi</span>
        </Button>
      </div>
    </div>
  );
}
