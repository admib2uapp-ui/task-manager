import { api } from "@/lib/api-client";

export interface AiChatRequest {
  message: string;
  conversationId?: string;
  projectId?: string;
}

export interface AiActionInfo {
  type: string;
  params: Record<string, unknown>;
  dangerous: boolean;
}

export interface AiActionResult {
  type: string;
  success: boolean;
  entityType: string;
  entityId?: string;
  error?: string;
}

export interface AiChatResponse {
  type: "chat" | "confirmation" | "action_result" | "error" | "cancelled";
  summary: string;
  intent?: string;
  conversationId: string;
  actions?: AiActionInfo[];
  messageId?: string;
  results?: AiActionResult[];
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  actionPlan?: Record<string, unknown> | null;
  status: string;
  error?: string | null;
  createdAt: string;
}

export interface AiConversation {
  id: string;
  title: string;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const aiApi = {
  sendMessage: (payload: AiChatRequest) =>
    api.post<AiChatResponse>("/ai/chat", payload),

  confirmActions: (messageId: string) =>
    api.post<AiChatResponse>("/ai/confirm", { messageId }),

  cancelActions: (messageId: string) =>
    api.post<AiChatResponse>("/ai/cancel", { messageId }),

  listConversations: () => api.get<AiConversation[]>("/ai/conversations"),

  getMessages: (conversationId: string) =>
    api.get<AiMessage[]>(`/ai/conversations/${conversationId}/messages`),
};
