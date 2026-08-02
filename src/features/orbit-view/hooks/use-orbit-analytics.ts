"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { orbitAnalyticsApi } from "@/features/orbit-view/api/orbit-api";

export function useOrbitAnalytics(projectId?: string) {
  const query = useQuery({
    queryKey: queryKeys.orbit.analytics(projectId ?? ""),
    queryFn: () => orbitAnalyticsApi.get(projectId!),
    enabled: !!projectId,
    refetchInterval: !!projectId ? 60_000 : undefined,
  });

  const refreshMutation = useMutation({
    mutationFn: () => orbitAnalyticsApi.refresh(projectId!),
    onSuccess: () => {
      query.refetch();
    },
  });

  return {
    analytics: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
