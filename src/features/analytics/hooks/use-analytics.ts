"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/features/analytics/api/analytics-api";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: analyticsApi.overview,
    staleTime: 60_000,
  });
}
