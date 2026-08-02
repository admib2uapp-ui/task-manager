"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/features/auth/store/auth-store";

export function useOrbitRealtime(projectId?: string) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || !projectId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`orbit-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_ideas", filter: `project_id=eq.${projectId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.ideas(projectId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.hub(projectId) });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_idea_votes" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.ideas(projectId) });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_idea_reactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.ideas(projectId) });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orbit_testing_metadata" },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.testing("*") });
          queryClient.invalidateQueries({ queryKey: queryKeys.orbit.hub(projectId) });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId, queryClient]);
}
