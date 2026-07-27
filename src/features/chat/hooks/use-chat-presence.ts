"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/features/auth/store/auth-store";

export function useChatPresence(chatId?: string) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!chatId || !user) return;

    const supabase = createClient();
    const channel = supabase.channel(`presence-${chatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const userIds = new Set<string>();
        for (const key of Object.keys(state)) {
          userIds.add(key);
        }
        setOnlineUserIds(userIds);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: user.id, onlineAt: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  return { onlineUserIds };
}
