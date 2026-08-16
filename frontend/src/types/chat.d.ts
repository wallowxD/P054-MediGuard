export {};

declare global {
  type TChatRole = "user" | "assistant" | "system";

  interface IChatMessage {
    role: TChatRole;
    content: string;
    createdAt?: string;
  }

  interface IChatContextSummary {
    checkId?: string | null;
    drugs: string[];
    diseases: string[];
    severityCounts: Record<string, number>;
    highlightWarning?: string | null;
    itemsSummary: Record<string, unknown>[];
    notesSummary: Record<string, unknown>[];
    unavailableSummary: Record<string, unknown>[];
  }

  /**
   * Ngữ cảnh khi người dùng đang mở trang thông tin một thuốc: các mục NGUYÊN VĂN của tờ
   * HDSD đang hiển thị. Khớp `ChatDrugContext` phía backend.
   */
  interface IChatDrugContext {
    drugId: string;
    brandName: string;
    ingredient?: string | null;
    leafletUrl?: string | null;
    sections: Record<string, string>;
  }

  /** Ngữ cảnh của màn hình đang mở, quyết định trợ lý được phép trích nguồn nào. */
  type TChatScope = "interaction" | "drug" | "general";

  interface IChatRequest {
    action?: "initial" | "chat";
    /** Cả hai ngữ cảnh đều optional — chat mở được ở mọi trang, kể cả khi chưa tra cứu */
    context?: IChatContextSummary | null;
    drugContext?: IChatDrugContext | null;
    messages?: IChatMessage[];
    userQuery?: string;
  }

  interface IChatResponse {
    reply: IChatMessage;
    quickSuggestions: string[];
  }
}
