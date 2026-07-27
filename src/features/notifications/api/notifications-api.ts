import { api } from "@/lib/api-client";
import type { NotificationType } from "@/types/domain";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  category: string | null;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  list: () => api.get<NotificationList>("/notifications"),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: string) =>
    api.post<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ message: string }>("/notifications/read-all"),
};
