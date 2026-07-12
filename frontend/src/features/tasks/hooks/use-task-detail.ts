"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { tasksApi } from "@/features/tasks/api/tasks-api";
import type { Task } from "@/types/domain";

export function useTaskDetailMutations(taskId: string) {
  const queryClient = useQueryClient();
  const detailKey = queryKeys.tasks.detail(taskId);

  const applyTask = (task: Task) => {
    queryClient.setQueryData(detailKey, task);
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
  };

  const refetchDetail = () =>
    queryClient.invalidateQueries({ queryKey: detailKey });

  const onError = (message: string) => () => toast.error(message);

  const addSubtask = useMutation({
    mutationFn: (title: string) => tasksApi.addSubtask(taskId, title),
    onSuccess: applyTask,
    onError: onError("Could not add subtask"),
  });

  const toggleSubtask = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      tasksApi.updateSubtask(taskId, id, { completed }),
    onSuccess: applyTask,
  });

  const deleteSubtask = useMutation({
    mutationFn: (id: string) => tasksApi.deleteSubtask(taskId, id),
    onSuccess: applyTask,
  });

  const addChecklistItem = useMutation({
    mutationFn: (content: string) => tasksApi.addChecklistItem(taskId, content),
    onSuccess: applyTask,
    onError: onError("Could not add item"),
  });

  const toggleChecklistItem = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      tasksApi.updateChecklistItem(taskId, id, { completed }),
    onSuccess: applyTask,
  });

  const deleteChecklistItem = useMutation({
    mutationFn: (id: string) => tasksApi.deleteChecklistItem(taskId, id),
    onSuccess: applyTask,
  });

  const addComment = useMutation({
    mutationFn: (body: string) => tasksApi.addComment(taskId, body),
    onSuccess: refetchDetail,
    onError: onError("Could not add comment"),
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      tasksApi.deleteComment(taskId, commentId),
    onSuccess: refetchDetail,
  });

  const addDependency = useMutation({
    mutationFn: (dependsOnId: string) =>
      tasksApi.addDependency(taskId, dependsOnId),
    onSuccess: applyTask,
    onError: onError("Could not add dependency"),
  });

  const removeDependency = useMutation({
    mutationFn: (dependsOnId: string) =>
      tasksApi.removeDependency(taskId, dependsOnId),
    onSuccess: applyTask,
  });

  return {
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addComment,
    deleteComment,
    addDependency,
    removeDependency,
  };
}
