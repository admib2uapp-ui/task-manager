import { api } from "@/lib/api-client";

export interface TimeEntry {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  description: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  isRunning: boolean;
  createdAt: string;
}

export interface ProjectTimeBreakdown {
  projectId: string | null;
  projectName: string;
  projectColor: string;
  seconds: number;
}

export interface TimeSummary {
  todaySeconds: number;
  weekSeconds: number;
  monthSeconds: number;
  perProject: ProjectTimeBreakdown[];
}

export interface StartTimerPayload {
  taskId?: string | null;
  projectId?: string | null;
  description?: string | null;
}

export interface ManualEntryPayload {
  taskId?: string | null;
  projectId?: string | null;
  description?: string | null;
  startedAt: string;
  endedAt: string;
}

export const timeApi = {
  list: () => api.get<TimeEntry[]>("/time-entries"),
  running: () => api.get<TimeEntry | null>("/time-entries/running"),
  summary: () => api.get<TimeSummary>("/time-entries/summary"),
  start: (payload: StartTimerPayload) =>
    api.post<TimeEntry>("/time-entries/start", payload),
  stop: () => api.post<TimeEntry>("/time-entries/stop"),
  createManual: (payload: ManualEntryPayload) =>
    api.post<TimeEntry>("/time-entries", payload),
  remove: (id: string) =>
    api.delete<{ message: string }>(`/time-entries/${id}`),
};
