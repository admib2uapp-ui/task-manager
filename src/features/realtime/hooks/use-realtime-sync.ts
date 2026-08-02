"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/store/auth-store";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase
      .channel("workspace-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notes"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat", "messages"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_entries" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["time-entries"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_ideas" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "ideas"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_idea_votes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "ideas"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_idea_reactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "ideas"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_testing_metadata" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "testing"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_sprints" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "sprints"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_risk_nodes" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "risks"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_analytics_snapshots" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["orbit", "analytics"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
