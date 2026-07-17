"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { env } from "@/lib/env";
import { queryKeys } from "@/lib/query-keys";

const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;
const BACKOFF_FACTOR = 2;

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const attemptRef = useRef(0);

  const connect = useCallback(() => {
    const supabase = createClient();

    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return;

      function doConnect() {
        if (closed) return;

        const wsBase = env.apiBaseUrl.replace(/^http/, "ws");
        socket = new WebSocket(
          `${wsBase}/api/${env.apiVersion}/ws?token=${encodeURIComponent(session!.access_token)}`,
        );

        socket.onopen = () => {
          attemptRef.current = 0;
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as { type?: string };
            if (message.type === "invalidate") {
              queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
              queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
            }
          } catch {
            /* ignore malformed frames */
          }
        };

        socket.onclose = () => {
          if (!closed) {
            const delay = Math.min(
              INITIAL_DELAY * Math.pow(BACKOFF_FACTOR, attemptRef.current),
              MAX_DELAY,
            );
            const jitter = delay * (0.5 + Math.random() * 0.5);
            attemptRef.current += 1;
            reconnectTimer = setTimeout(doConnect, jitter);
          }
        };
        socket.onerror = () => socket?.close();
      }

      doConnect();
    });

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [queryClient]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);
}
