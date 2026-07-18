"use client";

import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/features/users/api/users-api";

export function useWorkspaceMembers() {
  return useQuery({
    queryKey: ["users", "workspace-members"],
    queryFn: usersApi.list,
    staleTime: 60_000,
  });
}
