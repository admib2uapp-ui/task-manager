import { api } from "@/lib/api-client";

export interface SearchProject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface SearchTask {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  status: string;
  priority: string;
}

export interface SearchResponse {
  projects: SearchProject[];
  tasks: SearchTask[];
}

export const searchApi = {
  query: (q: string) => api.get<SearchResponse>("/search", { params: { q } }),
};
