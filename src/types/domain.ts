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
  SENIOR: "senior",
  GENERAL: "general",
  JUNIOR: "junior",
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
  TASK_CREATED: "task_created",
  TASK_ASSIGNED: "task_assigned",
  TASK_UPDATED: "task_updated",
  TASK_REOPENED: "task_reopened",
  TASK_DELETED: "task_deleted",
  PRIORITY_CHANGED: "priority_changed",
  STATUS_CHANGED: "status_changed",
  DEADLINE_CHANGED: "deadline_changed",
  ATTACHMENT_ADDED: "attachment_added",
  PROJECT_CREATED: "project_created",
  PROJECT_UPDATED: "project_updated",
  PROJECT_ARCHIVED: "project_archived",
  PROJECT_RESTORED: "project_restored",
  MEMBER_JOINED: "member_joined",
  MEMBER_REMOVED: "member_removed",
  MEMBER_BLOCKED: "member_blocked",
  MEMBER_UNBLOCKED: "member_unblocked",
  ROLE_CHANGED: "role_changed",
  PROJECT_COMPLETED: "project_completed",
  CHAT_REPLY: "chat_reply",
  CHAT_REACTION: "chat_reaction",
  CHAT_PINNED: "chat_pinned",
  CHAT_NEW_MESSAGE: "chat_new_message",
  THREAD_REPLY: "thread_reply",
  AI_ANALYSIS_COMPLETE: "ai_analysis_complete",
  AI_REPORT_READY: "ai_report_ready",
  AI_DOCS_READY: "ai_docs_ready",
  AI_TASKS_READY: "ai_tasks_ready",
  AI_SECURITY_SCAN: "ai_security_scan",
  AI_PERFORMANCE_REPORT: "ai_performance_report",
  GITHUB_REPO_CONNECTED: "github_repo_connected",
  GITHUB_REPO_DISCONNECTED: "github_repo_disconnected",
  GITHUB_SCAN_STARTED: "github_scan_started",
  GITHUB_SCAN_COMPLETED: "github_scan_completed",
  GITHUB_AI_ANALYSIS: "github_ai_analysis",
  GITHUB_PR_LINKED: "github_pr_linked",
  GITHUB_ISSUE_LINKED: "github_issue_linked",
  LOGIN_NEW_DEVICE: "login_new_device",
  PASSWORD_CHANGED: "password_changed",
  EMAIL_CHANGED: "email_changed",
  PERMISSION_CHANGED: "permission_changed",
  API_KEY_UPDATED: "api_key_updated",
  WORKSPACE_INVITATION: "workspace_invitation",
  WORKSPACE_ANNOUNCEMENT: "workspace_announcement",
  MAINTENANCE_NOTICE: "maintenance_notice",
  SYSTEM_UPDATE: "system_update",
} as const;
export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/* ----------------------------- Entities -------------------------------- */

export type MemberStatus = "active" | "blocked" | "removed";

export interface User {
  id: ID;
  email: string;
  name: string;
  avatarUrl: string | null;
  workspaceRole?: WorkspaceRole;
  status?: MemberStatus;
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
  createdBy?: ID | null;
  updatedBy?: ID | null;
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
  createdBy?: ID | null;
  creator?: User | null;
  updatedBy?: ID | null;
  updater?: User | null;
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
  createdBy?: ID | null;
  updatedBy?: ID | null;
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
  createdBy?: ID | null;
  creator?: User | null;
  updatedBy?: ID | null;
  updater?: User | null;
  tags: Tag[];
  subtasks?: Subtask[];
  checklist?: ChecklistItem[];
  comments?: Comment[];
  attachments?: Attachment[];
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
  createdBy?: ID | null;
  creator?: User | null;
  updatedBy?: ID | null;
  updater?: User | null;
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
  category: string | null;
  metadata: Record<string, unknown> | null;
  readAt: ISODateString | null;
  createdAt: ISODateString;
}

/* ----------------------------- Chat ------------------------------------- */

export interface ChatMessage {
  id: ID;
  chatId: ID;
  userId: ID;
  user?: User;
  body: string;
  replyToId: ID | null;
  replyTo?: ChatMessage | null;
  threadId: ID | null;
  threadMessages?: ChatMessage[];
  isEdited: boolean;
  editedAt: ISODateString | null;
  reactions?: ChatReaction[];
  attachments?: ChatAttachment[];
  mentions?: ChatMention[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ChatReaction {
  id: ID;
  messageId: ID;
  userId: ID;
  user?: User;
  emoji: string;
  createdAt: ISODateString;
}

export interface ChatReadReceipt {
  id: ID;
  messageId: ID;
  userId: ID;
  readAt: ISODateString;
}

export interface ChatAttachment {
  id: ID;
  messageId: ID;
  fileName: string;
  storedName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: ISODateString;
}

export interface ChatMention {
  id: ID;
  messageId: ID;
  userId: ID;
  user?: User;
  createdAt: ISODateString;
}

export interface ChatPin {
  id: ID;
  chatId: ID;
  messageId: ID;
  message?: ChatMessage;
  pinnedBy: ID;
  pinnedByUser?: User;
  createdAt: ISODateString;
}
