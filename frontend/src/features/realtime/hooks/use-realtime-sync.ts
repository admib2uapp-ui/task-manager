"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getAccessToken } from "@/lib/auth-storage";
import { env } from "@/lib/env";
import { queryKeys } from "@/lib/query-keys";

/**
 * Subscribes to the workspace WebSocket and invalidates affected caches so the
 * UI stays in sync across tabs/clients (live Kanban, dashboard, etc.).
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let closed = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      const token = getAccessToken();
      if (!token || closed) return;

      const wsBase = env.apiBaseUrl.replace(/^http/, "ws");
      socket = new WebSocket(
        `${wsBase}/api/${env.apiVersion}/ws?token=${encodeURIComponent(token)}`,
      );

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
        if (!closed) reconnectTimer = setTimeout(connect, 3000);
      };
      socket.onerror = () => socket?.close();
    }

    connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [queryClient]);
}
