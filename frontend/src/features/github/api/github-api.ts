import { api } from "@/lib/api-client";
import { API_URL } from "@/lib/env";

export interface GithubStatus {
  connected: boolean;
  login: string | null;
  avatarUrl: string | null;
}

export interface GithubRepo {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
  updatedAt: string | null;
  htmlUrl: string;
}

export const githubApi = {
  status: () => api.get<GithubStatus>("/auth/github/status"),

  connectUrl: () => `${API_URL}/auth/github/connect`,

  repos: (search?: string) =>
    api.get<GithubRepo[]>(
      `/auth/github/repos${search ? `?search=${encodeURIComponent(search)}` : ""}`,
    ),

  disconnect: () => api.post<{ message: string }>("/auth/github/disconnect"),

  quickConnect: (owner: string, repo: string) =>
    api.post("/repositories/quick-connect", {
      githubOwner: owner,
      githubRepo: repo,
    }),
};
