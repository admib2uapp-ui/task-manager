/**
 * Shared domain types.
 *
 * These mirror the backend API contract (FastAPI / SQLAlchemy models).
 * Feature-specific types extend or compose these primitives.
 */

export type ID = string;
export type ISODateString = string;

/* ----------------------------- Enums ---------------------------------- */

export const TASK_STATUS = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  DONE: "done",
} as const;
export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;
export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const PROJECT_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;
export type ProjectStatus =
  (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const WORKSPACE_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;
export type WorkspaceRole =
  (typeof WORKSPACE_ROLE)[keyof typeof WORKSPACE_ROLE];

export const NOTIFICATION_TYPE = {
  DEADLINE: "deadline",
  ASSIGNED: "assigned",
  COMPLETED: "completed",
  COMMENT: "comment",
  REMINDER: "reminder",
  OVERDUE: "overdue",
  MENTION: "mention",
} as const;
export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/* ----------------------------- Entities -------------------------------- */

export interface User {
  id: ID;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Workspace {
  id: ID;
  name: string;
  slug: string;
  ownerId: ID;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Tag {
  id: ID;
  workspaceId: ID;
  name: string;
  color: string;
}

export interface Milestone {
  id: ID;
  projectId: ID;
  name: string;
  description: string | null;
  dueDate: ISODateString | null;
  completed: boolean;
  position: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Project {
  id: ID;
  workspaceId: ID;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  status: ProjectStatus;
  deadline: ISODateString | null;
  repositoryUrl: string | null;
  progress: number;
  isFavorite: boolean;
  isArchived: boolean;
  tags: Tag[];
  milestones?: Milestone[];
  milestoneCount?: number;
  completedMilestoneCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ChecklistItem {
  id: ID;
  taskId: ID;
  content: string;
  completed: boolean;
  position: number;
}

export interface Subtask {
  id: ID;
  taskId: ID;
  title: string;
  completed: boolean;
  position: number;
}

export interface Comment {
  id: ID;
  taskId: ID;
  authorId: ID;
  author?: User;
  body: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Attachment {
  id: ID;
  taskId: ID;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: ISODateString;
}

export interface Task {
  id: ID;
  projectId: ID;
  project?: Pick<Project, "id" | "name" | "color" | "icon">;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assigneeId: ID | null;
  assignee?: User | null;
  deadline: ISODateString | null;
  estimatedHours: number | null;
  timeSpentSeconds: number;
  tags: Tag[];
  subtasks?: Subtask[];
  checklist?: ChecklistItem[];
  dependencyIds?: ID[];
  // GitHub integration
  githubRepoUrl: string | null;
  githubIssueUrl: string | null;
  githubPrUrl: string | null;
  githubBranch: string | null;
  isPinned: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface TimeEntry {
  id: ID;
  taskId: ID | null;
  projectId: ID | null;
  userId: ID;
  description: string | null;
  startedAt: ISODateString;
  endedAt: ISODateString | null;
  durationSeconds: number;
  createdAt: ISODateString;
}

export interface Note {
  id: ID;
  workspaceId: ID;
  projectId: ID | null;
  title: string;
  content: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ActivityEvent {
  id: ID;
  workspaceId: ID;
  actorId: ID;
  actor?: User;
  action: string;
  entityType: string;
  entityId: ID;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
}

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: ID | null;
  isRead: boolean;
  createdAt: ISODateString;
}
