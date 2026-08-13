"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useSendChatMessage } from "@/queries/chat";

export function convertResponseToContextSummary(result: IInteractionCheckResponse): IChatContextSummary {
  const highlight = result.items.find((item) => item.id === result.highlightId);
  const severityCounts: Record<string, number> = {};
  result.severityScale.forEach((s) => {
    severityCounts[s.severity] = s.resultCount;
  });

  return {
    checkId: result.checkId ?? undefined,
    drugs: result.drugs.map((d) => (d.ingredient ? `${d.brandName} (${d.ingredient})` : d.brandName)),
    diseases: result.diseases.map((d) => d.name),
    severityCounts,
    highlightWarning: highlight?.aiSummary?.warning,
    itemsSummary: result.items.map((item) => ({
      id: item.id,
      kind: item.kind,
      subject: item.subject,
      object: item.object,
      severity: item.severity,
      warning: item.aiSummary.warning,
      mechanism: item.mechanism,
      consequence: item.consequence,
      quotes: item.citations.map((c) => c.quote),
    })),
    notesSummary: result.notes.map((note) => ({
      id: note.id,
      kind: note.kind,
      subject: note.subject,
      object: note.object,
      severity: note.severity,
      effectDescription: note.effectDescription,
      management: note.management,
      quotes: note.citations.map((c) => c.quote),
    })),
    unavailableSummary: result.unavailable.map((un) => ({
      key: un.key,
      subject: un.subject,
      object: un.object,
      reason: un.reason,
    })),
  };
}

interface IChatContext {
  isOpen: boolean;
  contextSummary: IChatContextSummary | null;
  messages: IChatMessage[];
  quickSuggestions: string[];
  isLoading: boolean;
  openChatWithResult: (result: IInteractionCheckResponse) => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<IChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contextSummary, setContextSummary] = useState<IChatContextSummary | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const sendMutation = useSendChatMessage();

  const openChatWithResult = useCallback(
    (result: IInteractionCheckResponse) => {
      const newSummary = convertResponseToContextSummary(result);
      const isSameContext =
        contextSummary?.checkId === newSummary.checkId &&
        contextSummary?.drugs.join(",") === newSummary.drugs.join(",");

      setIsOpen(true);
      if (!isSameContext || messages.length === 0) {
        setContextSummary(newSummary);
        setMessages([]);
        setQuickSuggestions([]);

        // Gọi API tạo câu chào mở đầu nhận context
        sendMutation.mutate(
          { action: "initial", context: newSummary },
          {
            onSuccess: (data) => {
              setMessages([data.reply]);
              setQuickSuggestions(data.quickSuggestions);
            },
            onError: () => {
              const fallbackGreeting: IChatMessage = {
                role: "assistant",
                content: `Xin chào! Tôi thấy bạn đang tra cứu tương tác cho **${newSummary.drugs.join(", ")}**.\n\nHệ thống đã ghi nhận các dữ liệu an toàn. Bạn cần tôi giải thích thêm gì không?`,
              };
              setMessages([fallbackGreeting]);
            },
          }
        );
      }
    },
    [contextSummary, messages.length, sendMutation]
  );

  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !contextSummary) return;

      const userMsg: IChatMessage = {
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);

      try {
        const data = await sendMutation.mutateAsync({
          action: "chat",
          context: contextSummary,
          messages: nextMessages,
          userQuery: content.trim(),
        });
        setMessages((prev) => [...prev, data.reply]);
        setQuickSuggestions(data.quickSuggestions);
      } catch (err) {
        const errorMsg: IChatMessage = {
          role: "assistant",
          content: "Rất tiếc, đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại sau.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [contextSummary, messages, sendMutation]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setQuickSuggestions([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        contextSummary,
        messages,
        quickSuggestions,
        isLoading: sendMutation.isPending,
        openChatWithResult,
        closeChat,
        toggleChat,
        sendMessage,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat phải được dùng bên trong ChatProvider");
  }
  return context;
}
