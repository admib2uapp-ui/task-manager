import { api } from "@/lib/api-client";
import type { Project, Task } from "@/types/domain";

export interface DashboardStats {
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  dueToday: number;
  trackedTodaySeconds: number;
  completionRate: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  todayTasks: Task[];
  upcomingDeadlines: Task[];
  recentProjects: Project[];
  recentTasks: Task[];
}

export const dashboardApi = {
  get: () => api.get<DashboardResponse>("/dashboard"),
};
