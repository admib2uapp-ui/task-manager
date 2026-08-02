import { api } from "@/lib/api-client";
import type {
  OrbitIdea,
  IdeaMember,
  OrbitVote,
  OrbitReaction,
  TestingMetadata,
  OrbitSprint,
  OrbitRiskNode,
  ProjectAnalyticsSnapshot,
} from "@/features/orbit-view/types";

// ─── Ideas ───────────────────────────────────────────────────
export const orbitIdeasApi = {
  list: (projectId?: string) => {
    if (!projectId) return Promise.resolve([] as OrbitIdea[]);
    return api.get<OrbitIdea[]>("/orbit/ideas", { params: { projectId } });
  },

  get: (id: string) => api.get<OrbitIdea>(`/orbit/ideas/${id}`),

  create: (payload: {
    projectId?: string;
    title: string;
    description?: string | null;
    priority?: string;
    category?: string | null;
    labels?: string[];
    assignedMemberIds?: string[];
    status?: string;
  }) => api.post<OrbitIdea>("/orbit/ideas", payload),

  update: (id: string, payload: Partial<OrbitIdea>) =>
    api.patch<OrbitIdea>(`/orbit/ideas/${id}`, payload),

  remove: (id: string) => api.delete<{ message: string }>(`/orbit/ideas/${id}`),

  vote: (ideaId: string) =>
    api.post<OrbitVote>(`/orbit/ideas/${ideaId}/vote`),

  unvote: (ideaId: string) =>
    api.delete<{ message: string }>(`/orbit/ideas/${ideaId}/vote`),

  react: (ideaId: string, emoji: string) =>
    api.post<OrbitReaction>(`/orbit/ideas/${ideaId}/reactions`, { emoji }),
};

// ─── Testing Metadata ─────────────────────────────────────────
export const orbitTestingApi = {
  get: (taskId: string) =>
    api.get<TestingMetadata>(`/orbit/testing/${taskId}`),

  upsert: (taskId: string, payload: Partial<TestingMetadata>) =>
    api.patch<TestingMetadata>(`/orbit/testing/${taskId}`, payload),
};

// ─── Sprints ──────────────────────────────────────────────────
export const orbitSprintsApi = {
  list: (projectId: string) => {
    if (!projectId) return Promise.resolve([] as OrbitSprint[]);
    return api.get<OrbitSprint[]>("/orbit/sprints", { params: { projectId } });
  },

  get: (id: string) => api.get<OrbitSprint>(`/orbit/sprints/${id}`),

  create: (payload: {
    projectId: string;
    name: string;
    goal?: string | null;
    startDate: string;
    endDate: string;
  }) => api.post<OrbitSprint>("/orbit/sprints", payload),

  update: (id: string, payload: Partial<OrbitSprint>) =>
    api.patch<OrbitSprint>(`/orbit/sprints/${id}`, payload),

  remove: (id: string) => api.delete<{ message: string }>(`/orbit/sprints/${id}`),
};

// ─── Risk Nodes ───────────────────────────────────────────────
export const orbitRisksApi = {
  list: (projectId: string) => {
    if (!projectId) return Promise.resolve([] as OrbitRiskNode[]);
    return api.get<OrbitRiskNode[]>("/orbit/risks", { params: { projectId } });
  },

  update: (id: string, payload: Partial<OrbitRiskNode>) =>
    api.patch<OrbitRiskNode>(`/orbit/risks/${id}`, payload),
};

// ─── Analytics ────────────────────────────────────────────────
export const orbitAnalyticsApi = {
  get: (projectId: string) => {
    if (!projectId) return Promise.resolve(null as unknown as ProjectAnalyticsSnapshot);
    return api.get<ProjectAnalyticsSnapshot>("/orbit/analytics", { params: { projectId } });
  },

  refresh: (projectId: string) => {
    if (!projectId) return Promise.resolve(null as unknown as ProjectAnalyticsSnapshot);
    return api.post<ProjectAnalyticsSnapshot>("/orbit/analytics/refresh", { projectId });
  },
};

// ─── Idea Members ────────────────────────────────────────────
export const orbitIdeaMembersApi = {
  list: (ideaId: string) =>
    api.get<IdeaMember[]>(`/orbit/ideas/${ideaId}/members`),

  add: (ideaId: string, userId: string, role?: string) =>
    api.post<IdeaMember>(`/orbit/ideas/${ideaId}/members`, { userId, role }),

  remove: (ideaId: string, memberId: string) =>
    api.delete<{ message: string }>(`/orbit/ideas/${ideaId}/members/${memberId}`),
};

// ─── Card Links ───────────────────────────────────────────────
export const orbitLinksApi = {
  linkIdeaToTask: (ideaId: string, taskId: string) =>
    api.post<{ message: string }>("/orbit/links", { ideaId, taskId }),
};
