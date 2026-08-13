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

  interface IChatRequest {
    action?: "initial" | "chat";
    context: IChatContextSummary;
    messages?: IChatMessage[];
    userQuery?: string;
  }

  interface IChatResponse {
    reply: IChatMessage;
    quickSuggestions: string[];
  }
}
