"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { githubApi } from "@/features/github/api/github-api";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const githubQueryKeys = {
  status: ["github", "status"] as const,
  repos: (search?: string) => ["github", "repos", search] as const,
};

export function useGithubStatus() {
  return useQuery({
    queryKey: githubQueryKeys.status,
    queryFn: () => githubApi.status(),
  });
}

export function useGithubRepos(search?: string) {
  return useQuery({
    queryKey: githubQueryKeys.repos(search),
    queryFn: () => githubApi.repos(search),
    enabled: false,
  });
}

export function useDisconnectGithub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => githubApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubQueryKeys.status });
      queryClient.invalidateQueries({ queryKey: githubQueryKeys.repos() });
      toast.success("GitHub account disconnected");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not disconnect")),
  });
}

export function useQuickConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) =>
      githubApi.quickConnect(owner, repo),
    onSuccess: (_, { owner, repo }) => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      toast.success(`Connected ${owner}/${repo}`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not connect repository")),
  });
}
