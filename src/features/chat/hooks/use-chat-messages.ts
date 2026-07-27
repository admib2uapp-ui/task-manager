"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/features/chat/api/chat-api";

export const chatQueryKeys = {
  messages: (projectId: string) => ["chat", "messages", projectId] as const,
  search: (projectId: string, query: string) =>
    ["chat", "search", projectId, query] as const,
};

export function useChatMessages(projectId: string) {
  return useInfiniteQuery({
    queryKey: chatQueryKeys.messages(projectId),
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(projectId, pageParam as string | null | undefined),
    initialPageParam: undefined as string | null | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchOnWindowFocus: false,
  });
}

export function useInvalidateChat(projectId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: chatQueryKeys.messages(projectId),
    });
  };
}
