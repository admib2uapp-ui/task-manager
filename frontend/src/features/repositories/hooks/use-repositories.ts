"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import {
  repositoriesApi,
  type ReportType,
  type ScanType,
} from "@/features/repositories/api/repositories-api";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// ── Query Key ──────────────────────────────────────────────────────

export const repoQueryKeys = {
  all: ["repositories"] as const,
  detail: (id: string) => ["repositories", "detail", id] as const,
  scans: (id: string) => ["repositories", "scans", id] as const,
  fileTree: (id: string) => ["repositories", "fileTree", id] as const,
  issues: (id: string) => ["repositories", "issues", id] as const,
  reports: (id: string) => ["repositories", "reports", id] as const,
  score: (id: string) => ["repositories", "score", id] as const,
};

// ── Connections ────────────────────────────────────────────────────

export function useRepositories() {
  return useQuery({
    queryKey: repoQueryKeys.all,
    queryFn: () => repositoriesApi.list(),
  });
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: repoQueryKeys.detail(id),
    queryFn: () => repositoriesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useConnectRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      githubOwner: string;
      githubRepo: string;
      projectId?: string | null;
      accessToken?: string | null;
    }) => repositoriesApi.connect(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repoQueryKeys.all });
      toast.success("Repository connected");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not connect repository")),
  });
}

export function useDisconnectRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositoriesApi.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repoQueryKeys.all });
      toast.success("Repository disconnected");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not disconnect repository")),
  });
}

// ── Scans ──────────────────────────────────────────────────────────

export function useRepositoryScans(connectionId: string) {
  return useQuery({
    queryKey: repoQueryKeys.scans(connectionId),
    queryFn: () => repositoriesApi.scans(connectionId),
    enabled: Boolean(connectionId),
    refetchInterval: (query) => {
      const scans = query.state.data;
      if (!scans || scans.length === 0) return false;
      const latest = scans[0];
      return (latest.status === "pending" || latest.status === "running")
        ? 5000
        : false;
    },
  });
}

export function useTriggerScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      scanType = "full",
    }: {
      connectionId: string;
      scanType?: ScanType;
    }) => repositoriesApi.triggerScan(connectionId, scanType),
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.scans(connectionId),
      });
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.issues(connectionId),
      });
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.reports(connectionId),
      });
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.score(connectionId),
      });
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.fileTree(connectionId),
      });
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.all,
      });
      toast.success("Scan triggered");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not start scan")),
  });
}

// ── Metadata ──────────────────────────────────────────────────────

export function useRepoInfo(connectionId: string) {
  return useQuery({
    queryKey: [...repoQueryKeys.detail(connectionId), "repo-info"],
    queryFn: () => repositoriesApi.repoInfo(connectionId),
    enabled: Boolean(connectionId),
  });
}

export function useRepoLanguages(connectionId: string) {
  return useQuery({
    queryKey: [...repoQueryKeys.detail(connectionId), "languages"],
    queryFn: () => repositoriesApi.languages(connectionId),
    enabled: Boolean(connectionId),
  });
}

// ── File Tree ──────────────────────────────────────────────────────

export function useFileTree(connectionId: string, branch?: string) {
  return useQuery({
    queryKey: [...repoQueryKeys.fileTree(connectionId), branch],
    queryFn: () => repositoriesApi.fileTree(connectionId, branch),
    enabled: Boolean(connectionId),
  });
}

// ── AI Analysis ────────────────────────────────────────────────────

export function useAnalyzeRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      connectionId,
      reportType = "executive",
    }: {
      connectionId: string;
      reportType?: ReportType;
    }) => repositoriesApi.analyze(connectionId, reportType),
    onSuccess: (_, { connectionId }) => {
      queryClient.invalidateQueries({
        queryKey: repoQueryKeys.reports(connectionId),
      });
      toast.success("AI analysis complete");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "AI analysis failed")),
  });
}

// ── Code Issues ────────────────────────────────────────────────────

export function useCodeIssues(
  connectionId: string,
  filters?: { severity?: string; category?: string },
) {
  return useQuery({
    queryKey: [...repoQueryKeys.issues(connectionId), filters],
    queryFn: () => repositoriesApi.codeIssues(connectionId, filters),
    enabled: Boolean(connectionId),
  });
}

// ── AI Reports ─────────────────────────────────────────────────────

export function useAIReports(connectionId: string) {
  return useQuery({
    queryKey: repoQueryKeys.reports(connectionId),
    queryFn: () => repositoriesApi.aiReports(connectionId),
    enabled: Boolean(connectionId),
  });
}

// ── Repository Score ───────────────────────────────────────────────

export function useRepositoryScore(connectionId: string) {
  return useQuery({
    queryKey: repoQueryKeys.score(connectionId),
    queryFn: () => repositoriesApi.score(connectionId),
    enabled: Boolean(connectionId),
  });
}
