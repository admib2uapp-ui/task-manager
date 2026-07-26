import { api } from "@/lib/api-client";
import type {
  ChatMessage,
  ChatPin,
  User,
} from "@/types/domain";

export interface ChatMessagesResponse {
  chatId: string;
  messages: ChatMessage[];
  pins: ChatPin[];
  onlineUsers: { user_id: string; user: User }[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface SendMessagePayload {
  body: string;
  replyToId?: string | null;
  threadId?: string | null;
  mentionIds?: string[];
}

export interface SearchMessagesResponse {
  messages: Pick<ChatMessage, "id" | "body" | "userId" | "user" | "createdAt">[];
}

export interface UploadResponse {
  fileName: string;
  storedName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
}

export const chatApi = {
  getMessages: (projectId: string, cursor?: string | null, limit = 50) =>
    api.get<ChatMessagesResponse>(`/projects/${projectId}/chat`, {
      params: { cursor: cursor || undefined, limit: String(limit) },
    }),

  sendMessage: (projectId: string, payload: SendMessagePayload) =>
    api.post<ChatMessage>(`/projects/${projectId}/chat`, payload),

  editMessage: (projectId: string, messageId: string, body: string) =>
    api.patch<ChatMessage>(`/projects/${projectId}/chat/${messageId}`, { body }),

  deleteMessage: (projectId: string, messageId: string) =>
    api.delete<{ message: string }>(`/projects/${projectId}/chat/${messageId}`),

  toggleReaction: (projectId: string, messageId: string, emoji: string) =>
    api.post<{ removed: boolean; reaction?: unknown; reactionId?: string }>(
      `/projects/${projectId}/chat/${messageId}/reactions`,
      { emoji },
    ),

  pinMessage: (projectId: string, messageId: string) =>
    api.post<{ pinned: boolean }>(`/projects/${projectId}/chat/${messageId}/pin`),

  unpinMessage: (projectId: string, messageId: string) =>
    api.delete<{ message: string }>(`/projects/${projectId}/chat/${messageId}/pin`),

  searchMessages: (projectId: string, query: string) =>
    api.get<SearchMessagesResponse>(`/projects/${projectId}/chat/search`, {
      params: { q: query },
    }),

  uploadFile: (projectId: string, file: File, messageId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (messageId) formData.append("messageId", messageId);
    return api.post<UploadResponse>(`/projects/${projectId}/chat/upload`, formData);
  },
};
