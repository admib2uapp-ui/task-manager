"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { chatQueryKeys } from "@/features/chat/hooks/use-chat-messages";

export function useChatRealtime(projectId: string, chatId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: chatQueryKeys.messages(projectId),
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, projectId, queryClient]);
}
