import { api } from "@/lib/api-client";
import type {
  Comment,
  Subtask,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/types/domain";

export interface TaskListParams {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  tagId?: string;
  search?: string;
}

export interface TaskCreatePayload {
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  deadline?: string | null;
  estimatedHours?: number | null;
  tagIds?: string[];
  githubRepoUrl?: string | null;
  githubIssueUrl?: string | null;
  githubPrUrl?: string | null;
  githubBranch?: string | null;
}

export interface TaskUpdatePayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  deadline?: string | null;
  estimatedHours?: number | null;
  timeSpentSeconds?: number;
  tagIds?: string[];
  githubRepoUrl?: string | null;
  githubIssueUrl?: string | null;
  githubPrUrl?: string | null;
  githubBranch?: string | null;
  isPinned?: boolean;
}

export const tasksApi = {
  list: (params?: TaskListParams) =>
    api.get<Task[]>("/tasks", {
      params: params as Record<string, string | undefined>,
    }),

  get: (id: string) => api.get<Task>(`/tasks/${id}`),

  create: (payload: TaskCreatePayload) => api.post<Task>("/tasks", payload),

  update: (id: string, payload: TaskUpdatePayload) =>
    api.patch<Task>(`/tasks/${id}`, payload),

  move: (id: string, payload: { status: TaskStatus; position: number }) =>
    api.post<Task>(`/tasks/${id}/move`, payload),

  remove: (id: string) => api.delete<{ message: string }>(`/tasks/${id}`),

  addSubtask: (taskId: string, title: string) =>
    api.post<Task>(`/tasks/${taskId}/subtasks`, { title }),
  updateSubtask: (
    taskId: string,
    subtaskId: string,
    payload: Partial<Pick<Subtask, "title" | "completed" | "position">>,
  ) => api.patch<Task>(`/tasks/${taskId}/subtasks/${subtaskId}`, payload),
  deleteSubtask: (taskId: string, subtaskId: string) =>
    api.delete<Task>(`/tasks/${taskId}/subtasks/${subtaskId}`),

  addChecklistItem: (taskId: string, content: string) =>
    api.post<Task>(`/tasks/${taskId}/checklist`, { content }),
  updateChecklistItem: (
    taskId: string,
    itemId: string,
    payload: { content?: string; completed?: boolean },
  ) => api.patch<Task>(`/tasks/${taskId}/checklist/${itemId}`, payload),
  deleteChecklistItem: (taskId: string, itemId: string) =>
    api.delete<Task>(`/tasks/${taskId}/checklist/${itemId}`),

  addComment: (taskId: string, body: string) =>
    api.post<Comment>(`/tasks/${taskId}/comments`, { body }),
  deleteComment: (taskId: string, commentId: string) =>
    api.delete<{ message: string }>(`/tasks/${taskId}/comments/${commentId}`),

  addDependency: (taskId: string, dependsOnId: string) =>
    api.post<Task>(`/tasks/${taskId}/dependencies`, { dependsOnId }),
  removeDependency: (taskId: string, dependsOnId: string) =>
    api.delete<Task>(`/tasks/${taskId}/dependencies/${dependsOnId}`),
};
