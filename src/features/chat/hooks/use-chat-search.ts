"use client";

import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/features/chat/api/chat-api";
import { chatQueryKeys } from "@/features/chat/hooks/use-chat-messages";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function useChatSearch(projectId: string, query: string) {
  const debouncedQuery = useDebouncedValue(query, 300);

  return useQuery({
    queryKey: chatQueryKeys.search(projectId, debouncedQuery),
    queryFn: () => chatApi.searchMessages(projectId, debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });
}
