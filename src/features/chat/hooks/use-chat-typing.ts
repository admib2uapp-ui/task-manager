"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/features/auth/store/auth-store";

interface TypingUser {
  userId: string;
  name: string;
  timestamp: number;
}

export function useChatTyping(chatId?: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const user = useAuthStore((s) => s.user);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    const supabase = createClient();
    const channel = supabase.channel(`typing-${chatId}`);

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        const data = payload.payload as TypingUser;
        if (data.userId === user.id) return;

        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.userId !== data.userId);
          return [...filtered, { ...data, timestamp: Date.now() }];
        });
      })
      .subscribe();

    channelRef.current = channel;

    const interval = setInterval(() => {
      setTypingUsers((prev) =>
        prev.filter((u) => Date.now() - u.timestamp < 3000),
      );
    }, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [chatId, user]);

  const broadcastTyping = useCallback(() => {
    if (!channelRef.current || !user) return;

    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: user.id, name: user.name, timestamp: Date.now() },
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  }, [user]);

  return { typingUsers, broadcastTyping };
}
