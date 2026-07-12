import { api } from "@/lib/api-client";

export interface AnalyticsPoint {
  date: string;
  value: number;
}

export interface LabelCount {
  label: string;
  count: number;
}

export interface AnalyticsOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  avgCompletionHours: number;
  statusDistribution: LabelCount[];
  priorityDistribution: LabelCount[];
  completedPerDay: AnalyticsPoint[];
  hoursPerDay: AnalyticsPoint[];
}

export const analyticsApi = {
  overview: () => api.get<AnalyticsOverview>("/analytics"),
};
