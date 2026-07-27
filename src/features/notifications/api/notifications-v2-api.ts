import { api } from "@/lib/api-client";
import type { Notification } from "@/types/domain";

export interface NotificationPreferences {
  id: string;
  userId: string;
  assignmentEmails: boolean;
  deadlineEmails: boolean;
  chatEmails: boolean;
  githubEmails: boolean;
  aiEmails: boolean;
  securityEmails: boolean;
  workspaceEmails: boolean;
  systemEmails: boolean;
}

export interface NotificationHistoryResponse {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

export interface CreateNotificationPayload {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  category?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface QueueEmailPayload {
  userId: string;
  toEmail: string;
  templateName: string;
  subject: string;
  data?: Record<string, unknown>;
  scheduledFor?: string;
}

export const notificationsV2Api = {
  create: (payload: CreateNotificationPayload) =>
    api.post<Notification>("/notifications/create", payload),

  batchMarkRead: (ids: string[]) =>
    api.post<{ success: boolean }>("/notifications/batch-read", { ids }),

  archive: (ids: string[]) =>
    api.post<{ success: boolean }>("/notifications/archive", { ids }),

  delete: (id: string) =>
    api.delete<never>(`/notifications/archive?id=${id}`),

  history: (params?: {
    cursor?: string | null;
    limit?: number;
    category?: string | null;
    search?: string | null;
    type?: string | null;
  }) =>
    api.get<NotificationHistoryResponse>("/notifications/history", { params }),

  getPreferences: () =>
    api.get<NotificationPreferences>("/notifications/preferences"),

  updatePreferences: (prefs: Partial<NotificationPreferences>) =>
    api.put<NotificationPreferences>("/notifications/preferences", prefs),

  getTemplates: () =>
    api.get<
      { id: string; name: string; category: string; subjectTemplate: string }[]
    >("/notifications/templates"),

  queueEmail: (payload: QueueEmailPayload) =>
    api.post<{ id: string }>("/emails/queue", payload),
};
