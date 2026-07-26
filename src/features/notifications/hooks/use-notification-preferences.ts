"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsV2Api } from "@/features/notifications/api/notifications-v2-api";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences,
    queryFn: () => notificationsV2Api.getPreferences(),
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Parameters<typeof notificationsV2Api.updatePreferences>[0]) =>
      notificationsV2Api.updatePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences });
      toast.success("Notification preferences updated");
    },
    onError: () => toast.error("Failed to update preferences"),
  });
}
