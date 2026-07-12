"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  timeApi,
  type ManualEntryPayload,
  type StartTimerPayload,
} from "@/features/time/api/time-api";

const keys = {
  list: ["time", "list"] as const,
  running: ["time", "running"] as const,
  summary: ["time", "summary"] as const,
};

function useInvalidateTime() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["time"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  };
}

export function useTimeEntries() {
  return useQuery({ queryKey: keys.list, queryFn: timeApi.list });
}

export function useRunningTimer() {
  return useQuery({
    queryKey: keys.running,
    queryFn: timeApi.running,
    refetchInterval: 30_000,
  });
}

export function useTimeSummary() {
  return useQuery({ queryKey: keys.summary, queryFn: timeApi.summary });
}

export function useStartTimer() {
  const invalidate = useInvalidateTime();
  return useMutation({
    mutationFn: (payload: StartTimerPayload) => timeApi.start(payload),
    onSuccess: invalidate,
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Could not start timer"),
  });
}

export function useStopTimer() {
  const invalidate = useInvalidateTime();
  return useMutation({
    mutationFn: () => timeApi.stop(),
    onSuccess: () => {
      invalidate();
      toast.success("Timer stopped");
    },
  });
}

export function useCreateManualEntry() {
  const invalidate = useInvalidateTime();
  return useMutation({
    mutationFn: (payload: ManualEntryPayload) => timeApi.createManual(payload),
    onSuccess: () => {
      invalidate();
      toast.success("Time logged");
    },
    onError: (e) =>
      toast.error(e instanceof ApiError ? e.message : "Could not log time"),
  });
}

export function useDeleteTimeEntry() {
  const invalidate = useInvalidateTime();
  return useMutation({
    mutationFn: (id: string) => timeApi.remove(id),
    onSuccess: invalidate,
  });
}
