"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import {
  tasksApi,
  type TaskCreatePayload,
  type TaskListParams,
  type TaskUpdatePayload,
} from "@/features/tasks/api/tasks-api";
import type { Task, TaskStatus } from "@/types/domain";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function useTasks(params?: TaskListParams) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => tasksApi.list(params),
  });
}

export function useTask(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksApi.get(id),
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCreatePayload) => tasksApi.create(payload),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(task.projectId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success("Task created");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not create task")),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TaskUpdatePayload }) =>
      tasksApi.update(id, payload),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks.detail(task.id), task);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(task.projectId),
      });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not update task")),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success("Task deleted");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Could not delete task")),
  });
}

/**
 * Persist a task move. Optimistically patches the project task list so the
 * board stays in sync across components; reconciles on settle.
 */
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();
  const listKey = queryKeys.tasks.list({ projectId });

  return useMutation({
    mutationFn: ({
      id,
      status,
      position,
    }: {
      id: string;
      status: TaskStatus;
      position: number;
    }) => tasksApi.move(id, { status, position }),

    onMutate: async ({ id, status, position }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);
      if (previous) {
        queryClient.setQueryData<Task[]>(
          listKey,
          previous.map((t) => (t.id === id ? { ...t, status, position } : t)),
        );
      }
      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(listKey, context.previous);
      }
      toast.error("Could not move task");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
}
