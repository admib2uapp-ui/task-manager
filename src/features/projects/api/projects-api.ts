import { api } from "@/lib/api-client";
import type { Milestone, Project } from "@/types/domain";

export interface ProjectListParams {
  includeArchived?: boolean;
  status?: string;
  favorite?: boolean;
  search?: string;
}

export interface ProjectPayload {
  name: string;
  description?: string | null;
  color?: string;
  icon?: string;
  status?: string;
  deadline?: string | null;
  repositoryUrl?: string | null;
  tagIds?: string[];
}

export interface ProjectUpdatePayload extends Partial<ProjectPayload> {
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface MilestonePayload {
  name: string;
  description?: string | null;
  dueDate?: string | null;
  position?: number;
}

export interface MilestoneUpdatePayload extends Partial<MilestonePayload> {
  completed?: boolean;
}

export const projectsApi = {
  list: (params?: ProjectListParams) =>
    api.get<Project[]>("/projects", {
      params: params as Record<
        string,
        string | number | boolean | undefined | null
      >,
    }),

  get: (id: string) => api.get<Project>(`/projects/${id}`),

  create: (payload: ProjectPayload) => api.post<Project>("/projects", payload),

  update: (id: string, payload: ProjectUpdatePayload) =>
    api.patch<Project>(`/projects/${id}`, payload),

  remove: (id: string) => api.delete<{ message: string }>(`/projects/${id}`),

  listMilestones: (projectId: string) =>
    api.get<Milestone[]>(`/projects/${projectId}/milestones`),

  createMilestone: (projectId: string, payload: MilestonePayload) =>
    api.post<Milestone>(`/projects/${projectId}/milestones`, payload),

  updateMilestone: (
    projectId: string,
    milestoneId: string,
    payload: MilestoneUpdatePayload,
  ) =>
    api.patch<Milestone>(
      `/projects/${projectId}/milestones/${milestoneId}`,
      payload,
    ),

  deleteMilestone: (projectId: string, milestoneId: string) =>
    api.delete<{ message: string }>(
      `/projects/${projectId}/milestones/${milestoneId}`,
    ),
};
