import type { ProjectStatus, TaskPriority, TaskStatus } from "@/types/domain";
import { PROJECT_STATUS, TASK_PRIORITY, TASK_STATUS } from "@/types/domain";

/**
 * UI metadata (labels, colors, ordering) for domain enums.
 * Colors reference CSS variables / tailwind tokens so they stay theme-aware.
 */

export interface StatusMeta {
  value: TaskStatus;
  label: string;
  /** hex used for dots / accents */
  color: string;
  description: string;
}

export const TASK_STATUS_META: Record<TaskStatus, StatusMeta> = {
  [TASK_STATUS.BACKLOG]: {
    value: TASK_STATUS.BACKLOG,
    label: "Backlog",
    color: "#71717a",
    description: "Not yet planned",
  },
  [TASK_STATUS.TODO]: {
    value: TASK_STATUS.TODO,
    label: "To Do",
    color: "#a1a1aa",
    description: "Ready to be worked on",
  },
  [TASK_STATUS.IN_PROGRESS]: {
    value: TASK_STATUS.IN_PROGRESS,
    label: "In Progress",
    color: "#3b82f6",
    description: "Currently being worked on",
  },
  [TASK_STATUS.REVIEW]: {
    value: TASK_STATUS.REVIEW,
    label: "Review",
    color: "#f59e0b",
    description: "Awaiting review",
  },
  [TASK_STATUS.DONE]: {
    value: TASK_STATUS.DONE,
    label: "Done",
    color: "#22c55e",
    description: "Completed",
  },
};

/** Ordered list used to render Kanban columns left-to-right. */
export const KANBAN_COLUMNS: TaskStatus[] = [
  TASK_STATUS.BACKLOG,
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.REVIEW,
  TASK_STATUS.DONE,
];

export interface PriorityMeta {
  value: TaskPriority;
  label: string;
  color: string;
  /** relative weight for sorting (higher = more urgent) */
  weight: number;
}

export const TASK_PRIORITY_META: Record<TaskPriority, PriorityMeta> = {
  [TASK_PRIORITY.CRITICAL]: {
    value: TASK_PRIORITY.CRITICAL,
    label: "Critical",
    color: "#ef4444",
    weight: 4,
  },
  [TASK_PRIORITY.HIGH]: {
    value: TASK_PRIORITY.HIGH,
    label: "High",
    color: "#f59e0b",
    weight: 3,
  },
  [TASK_PRIORITY.MEDIUM]: {
    value: TASK_PRIORITY.MEDIUM,
    label: "Medium",
    color: "#3b82f6",
    weight: 2,
  },
  [TASK_PRIORITY.LOW]: {
    value: TASK_PRIORITY.LOW,
    label: "Low",
    color: "#71717a",
    weight: 1,
  },
};

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { value: ProjectStatus; label: string; color: string }
> = {
  [PROJECT_STATUS.ACTIVE]: {
    value: PROJECT_STATUS.ACTIVE,
    label: "Active",
    color: "#22c55e",
  },
  [PROJECT_STATUS.PAUSED]: {
    value: PROJECT_STATUS.PAUSED,
    label: "Paused",
    color: "#f59e0b",
  },
  [PROJECT_STATUS.COMPLETED]: {
    value: PROJECT_STATUS.COMPLETED,
    label: "Completed",
    color: "#3b82f6",
  },
  [PROJECT_STATUS.ARCHIVED]: {
    value: PROJECT_STATUS.ARCHIVED,
    label: "Archived",
    color: "#71717a",
  },
};

/** Default tag catalogue seeded per workspace. */
export const DEFAULT_TAGS: { name: string; color: string }[] = [
  { name: "Frontend", color: "#3b82f6" },
  { name: "Backend", color: "#22c55e" },
  { name: "API", color: "#06b6d4" },
  { name: "Database", color: "#8b5cf6" },
  { name: "AI", color: "#ec4899" },
  { name: "Machine Learning", color: "#f43f5e" },
  { name: "YOLO", color: "#f97316" },
  { name: "FastAPI", color: "#14b8a6" },
  { name: "Next.js", color: "#e4e4e7" },
  { name: "React", color: "#38bdf8" },
  { name: "Python", color: "#facc15" },
  { name: "UI", color: "#a78bfa" },
  { name: "UX", color: "#c084fc" },
  { name: "Testing", color: "#84cc16" },
  { name: "Bug", color: "#ef4444" },
  { name: "Feature", color: "#22c55e" },
  { name: "Research", color: "#6366f1" },
  { name: "Assignment", color: "#eab308" },
  { name: "Documentation", color: "#94a3b8" },
  { name: "Meeting", color: "#fb7185" },
  { name: "Deployment", color: "#0ea5e9" },
  { name: "Security", color: "#f59e0b" },
  { name: "DevOps", color: "#10b981" },
];

/** Curated palette for project color pickers. */
export const PROJECT_COLORS: string[] = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#14b8a6",
  "#f97316",
  "#8b5cf6",
  "#eab308",
  "#64748b",
];
