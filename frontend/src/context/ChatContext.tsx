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

/**
 * Phiên chat hiện tại. Trợ lý mở được ở MỌI trang, nên phiên phải nói rõ nó đang đứng
 * trên ngữ cảnh nào — backend chọn prompt và nguồn được phép trích theo đúng scope này.
 */
export type TChatSession =
  | { scope: "interaction"; summary: IChatContextSummary }
  | { scope: "drug"; drug: IChatDrugContext }
  | { scope: "general" };

const GENERAL_SESSION: TChatSession = { scope: "general" };

/** Khoá so sánh phiên: đổi khoá = đổi ngữ cảnh = phải bắt đầu hội thoại mới. */
function sessionKey(session: TChatSession): string {
  if (session.scope === "interaction") {
    return `interaction:${session.summary.checkId ?? ""}:${session.summary.drugs.join(",")}`;
  }
  if (session.scope === "drug") return `drug:${session.drug.drugId}`;
  return "general";
}

/** Ngữ cảnh gửi kèm mỗi request — chỉ một trong hai trường có giá trị. */
function sessionPayload(session: TChatSession): Pick<IChatRequest, "context" | "drugContext"> {
  return {
    context: session.scope === "interaction" ? session.summary : null,
    drugContext: session.scope === "drug" ? session.drug : null,
  };
}

/** Câu chào dự phòng khi API lời chào lỗi — không để panel trống trơn. */
function fallbackGreeting(session: TChatSession): string {
  if (session.scope === "interaction") {
    return `Xin chào! Tôi thấy bạn đang tra cứu tương tác cho **${session.summary.drugs.join(", ")}**.\n\nHệ thống đã ghi nhận các dữ liệu an toàn. Bạn cần tôi giải thích thêm gì không?`;
  }
  if (session.scope === "drug") {
    return `Xin chào! Bạn đang xem tờ hướng dẫn sử dụng của **${session.drug.brandName}**.\n\nTôi có thể trích lại nội dung trong tài liệu này để giải thích cho bạn. Bạn muốn hỏi mục nào?`;
  }
  return "Xin chào! Tôi là trợ lý An toàn Thuốc. Màn hình này chưa có dữ liệu tra cứu, nhưng tôi có thể hướng dẫn bạn dùng hệ thống hoặc giải thích các thuật ngữ trong kết quả tra cứu.";
}

interface IChatContext {
  isOpen: boolean;
  /** Ngữ cảnh của hội thoại đang diễn ra trong panel */
  session: TChatSession;
  /** Kết quả tra cứu đang hiển thị trên trang, để nút bác sĩ mở chat trong một lần bấm */
  activeResult: IInteractionCheckResponse | null;
  /** Tờ HDSD trang hiện tại đang mở, nếu có */
  activeDrug: IChatDrugContext | null;
  /** Tăng sau mỗi lượt tra cứu mới; dùng làm `key` để phát lại hiệu ứng nhắc của nút bác sĩ */
  resultVersion: number;
  messages: IChatMessage[];
  quickSuggestions: string[];
  isLoading: boolean;
  registerResult: (result: IInteractionCheckResponse) => void;
  /** Trang thuốc gọi khi mount, gọi lại với `null` khi rời trang */
  registerDrugContext: (drug: IChatDrugContext | null) => void;
  openChat: () => void;
  openChatWithResult: (result: IInteractionCheckResponse) => void;
  closeChat: () => void;
  toggleChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
}

const ChatContext = createContext<IChatContext | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<TChatSession>(GENERAL_SESSION);
  const [activeResult, setActiveResult] = useState<IInteractionCheckResponse | null>(null);
  const [activeDrug, setActiveDrug] = useState<IChatDrugContext | null>(null);
  const [resultVersion, setResultVersion] = useState(0);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const sendMutation = useSendChatMessage();
  const { mutate: sendChat, mutateAsync: sendChatAsync } = sendMutation;

  /**
   * Mở panel trên một ngữ cảnh. Giữ nguyên hội thoại nếu vẫn đúng ngữ cảnh cũ; đổi ngữ
   * cảnh thì bắt đầu lại và xin câu chào mở đầu tương ứng.
   */
  const startSession = useCallback(
    (next: TChatSession) => {
      setIsOpen(true);
      // Đúng ngữ cảnh cũ thì giữ nguyên hội thoại. `isPending` chặn trường hợp bấm mở
      // hai lần lúc lời chào chưa về — nếu không sẽ gọi API lời chào thêm một lần nữa.
      const isSameSession = sessionKey(next) === sessionKey(session);
      if (isSameSession && (messages.length > 0 || sendMutation.isPending)) return;

      setSession(next);
      setMessages([]);
      setQuickSuggestions([]);

      sendChat(
        { action: "initial", ...sessionPayload(next) },
        {
          onSuccess: (data) => {
            setMessages([data.reply]);
            setQuickSuggestions(data.quickSuggestions);
          },
          onError: () => {
            setMessages([{ role: "assistant", content: fallbackGreeting(next) }]);
          },
        }
      );
    },
    [messages.length, sendChat, sendMutation.isPending, session]
  );

  // Trang kết quả chỉ *đăng ký* context, không tự mở chat và không gọi API lời chào.
  // Nút bác sĩ nổi mới là nơi mở chat, nên người dùng chỉ cần một lần bấm.
  const registerResult = useCallback((result: IInteractionCheckResponse) => {
    setActiveResult(result);
    setResultVersion((version) => version + 1);
  }, []);

  const registerDrugContext = useCallback((drug: IChatDrugContext | null) => {
    setActiveDrug(drug);
  }, []);

  /**
   * Thứ tự ưu tiên: tờ HDSD của trang hiện tại > lượt tra cứu gần nhất > không ngữ cảnh.
   * Đang đọc leaflet mà trợ lý lại bám lượt tra cứu cũ ở trang khác là sai trực giác;
   * ngược lại, rời trang thuốc rồi thì lượt tra cứu gần nhất vẫn là thứ đáng hỏi nhất.
   */
  const openChat = useCallback(() => {
    if (activeDrug) {
      startSession({ scope: "drug", drug: activeDrug });
      return;
    }
    if (activeResult) {
      startSession({ scope: "interaction", summary: convertResponseToContextSummary(activeResult) });
      return;
    }
    startSession(GENERAL_SESSION);
  }, [activeDrug, activeResult, startSession]);

  const openChatWithResult = useCallback(
    (result: IInteractionCheckResponse) => {
      startSession({ scope: "interaction", summary: convertResponseToContextSummary(result) });
    },
    [startSession]
  );

  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMsg: IChatMessage = {
        role: "user",
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const nextMessages = [...messages, userMsg];
      setMessages(nextMessages);

      try {
        const data = await sendChatAsync({
          action: "chat",
          ...sessionPayload(session),
          messages: nextMessages,
          userQuery: content.trim(),
        });
        setMessages((prev) => [...prev, data.reply]);
        setQuickSuggestions(data.quickSuggestions);
      } catch {
        const errorMsg: IChatMessage = {
          role: "assistant",
          content: "Rất tiếc, đã xảy ra lỗi khi xử lý câu hỏi. Vui lòng thử lại sau.",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    },
    [messages, sendChatAsync, session]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setQuickSuggestions([]);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        session,
        activeResult,
        activeDrug,
        resultVersion,
        messages,
        quickSuggestions,
        isLoading: sendMutation.isPending,
        registerResult,
        registerDrugContext,
        openChat,
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
