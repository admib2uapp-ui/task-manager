"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/features/notifications/api/notifications-api";

const keys = {
  list: ["notifications", "list"] as const,
  unread: ["notifications", "unread"] as const,
};

export function useNotifications() {
  return useQuery({ queryKey: keys.list, queryFn: notificationsApi.list });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: keys.unread,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 60_000,
    select: (data) => data.count,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
