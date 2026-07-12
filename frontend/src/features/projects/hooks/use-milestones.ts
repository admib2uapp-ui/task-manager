"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  projectsApi,
  type MilestonePayload,
  type MilestoneUpdatePayload,
} from "@/features/projects/api/projects-api";

const milestonesKey = (projectId: string) =>
  ["projects", "detail", projectId, "milestones"] as const;

function invalidate(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
) {
  queryClient.invalidateQueries({ queryKey: milestonesKey(projectId) });
  queryClient.invalidateQueries({
    queryKey: queryKeys.projects.detail(projectId),
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
}

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: milestonesKey(projectId),
    queryFn: () => projectsApi.listMilestones(projectId),
    enabled: Boolean(projectId),
  });
}

export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: MilestonePayload) =>
      projectsApi.createMilestone(projectId, payload),
    onSuccess: () => invalidate(queryClient, projectId),
    onError: (error) =>
      toast.error(
        error instanceof ApiError ? error.message : "Could not add milestone",
      ),
  });
}

export function useUpdateMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      payload,
    }: {
      milestoneId: string;
      payload: MilestoneUpdatePayload;
    }) => projectsApi.updateMilestone(projectId, milestoneId, payload),
    onSuccess: () => invalidate(queryClient, projectId),
    onError: (error) =>
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not update milestone",
      ),
  });
}

export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) =>
      projectsApi.deleteMilestone(projectId, milestoneId),
    onSuccess: () => invalidate(queryClient, projectId),
    onError: (error) =>
      toast.error(
        error instanceof ApiError
          ? error.message
          : "Could not delete milestone",
      ),
  });
}
