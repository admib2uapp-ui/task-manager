"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsV2Api } from "@/features/notifications/api/notifications-v2-api";
import { queryKeys } from "@/lib/query-keys";


export function useNotificationHistory(params?: {
  cursor?: string | null;
  limit?: number;
  category?: string | null;
  search?: string | null;
  type?: string | null;
}) {
  return useQuery({
    queryKey: queryKeys.notifications.history(params),
    queryFn: () => notificationsV2Api.history(params),
  });
}

export function useBatchMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => notificationsV2Api.batchMarkRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useArchiveNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => notificationsV2Api.archive(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsV2Api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
