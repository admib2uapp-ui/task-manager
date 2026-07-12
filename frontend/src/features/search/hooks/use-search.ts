"use client";

import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/features/search/api/search-api";

export function useSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["search", trimmed],
    queryFn: () => searchApi.query(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 15_000,
  });
}
