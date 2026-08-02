import type { Task, User } from "@/types/domain";

export type OrbitHubType =
  | "ideas"
  | "development"
  | "testing"
  | "review"
  | "completed";

export type OrbitViewMode = "workspace" | "full-viz" | "galaxy";

export type IdeaPriority = "low" | "medium" | "high" | "critical";
export type IdeaStatus = "backlog" | "draft" | "submitted" | "planned" | "approved" | "development" | "testing" | "review" | "completed" | "rejected" | "archived";

export interface IdeaMember {
  id: string;
  ideaId: string;
  userId: string;
  role: string;
  assignedAt?: string;
  user?: User;
}
export type RegressionStatus = "pending" | "passing" | "failing" | "regression";
export type SprintStatus = "planning" | "active" | "completed";

export type RiskType =
  | "blocked_task"
  | "overdue_work"
  | "missing_review"
  | "high_priority_bug"
  | "critical_issue"
  | "failed_testing"
  | "dependency_conflict"
  | "performance"
  | "security"
  | "resource";

export type RiskStatus = "active" | "mitigated" | "resolved";

export interface OrbitIdea {
  id: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  richText: Record<string, unknown> | null;
  priority: IdeaPriority;
  category: string | null;
  labels: string[];
  assignedMemberIds: string[];
  members?: IdeaMember[];
  estimatedHours: number | null;
  dueDate: string | null;
  status: IdeaStatus;
  aiSummary: string | null;
  githubLinks: string[];
  relatedTaskIds: string[];
  relatedFileUrls: string[];
  createdBy: string | null;
  creator?: User | null;
  votes?: OrbitVote[];
  reactions?: OrbitReaction[];
  voteCount?: number;
  reactionCount?: number;
  commentCount?: number;
}

export interface OrbitVote {
  id: string;
  ideaId: string;
  userId: string;
  createdAt: string;
}

export interface OrbitReaction {
  id: string;
  ideaId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface TestingMetadata {
  id: string;
  taskId: string;
  qaChecklist: QAChecklistItem[];
  testCases: TestCase[];
  passCount: number;
  failCount: number;
  bugReportIds: string[];
  screenshotUrls: string[];
  screenRecordingUrls: string[];
  testNotes: string | null;
  regressionStatus: RegressionStatus;
  testingProgress: number;
  testerId: string | null;
  tester?: User | null;
  testedAt: string | null;
}

export interface QAChecklistItem {
  id: string;
  content: string;
  completed: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  status: "pass" | "fail" | "skipped";
  description?: string;
}

export interface OrbitSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  velocity: number;
  tasks?: OrbitSprintTask[];
}

export interface OrbitSprintTask {
  id: string;
  sprintId: string;
  taskId: string;
  storyPoints: number;
  task?: Task;
}

export interface OrbitRiskNode {
  id: string;
  projectId: string;
  entityType: string;
  entityId: string;
  riskScore: number;
  riskType: RiskType;
  status: RiskStatus;
  ownerId: string | null;
  owner?: User | null;
  resolutionSuggestion: string | null;
  riskTimeline: RiskEvent[];
}

export interface RiskEvent {
  date: string;
  score: number;
  note: string;
}

export interface ProjectAnalyticsSnapshot {
  id: string;
  projectId: string;
  snapshotDate: string;
  data: AnalyticsData;
}

export interface AnalyticsData {
  projectProgress: number;
  developmentProgress: number;
  testingProgress: number;
  reviewProgress: number;
  completedPercentage: number;
  velocity: number;
  cycleTime: number;
  leadTime: number;
  riskScore: number;
  teamProductivity: number;
  aiHealthScore: number;
  githubHealthScore: number;
  sprintMetrics: SprintMetrics;
  burndown: BurndownPoint[];
  lastUpdated: string;
}

export interface SprintMetrics {
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingStoryPoints: number;
  sprintDay: number;
  totalSprintDays: number;
}

export interface BurndownPoint {
  date: string;
  ideal: number;
  actual: number;
}

export interface OrbitCard {
  id: string;
  hubType: OrbitHubType;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assignees: User[];
  tags: string[];
  commentCount: number;
  attachmentCount: number;
  deadline: string | null;
  // hub-specific
  idea?: OrbitIdea;
  task?: Task;
  testing?: TestingMetadata;
  // metadata
  isDragging?: boolean;
}

export interface OrbitHubData {
  type: OrbitHubType;
  label: string;
  icon: string;
  cards: OrbitCard[];
  progress: number;
  color: string;
  count: number;
}

export interface OrbitFilters {
  sprintId?: string;
  priority?: string;
  memberId?: string;
  riskLevel?: string;
  repository?: string;
  label?: string;
  status?: string;
  dueDateRange?: { from: string; to: string };
  tags?: string[];
  search?: string;
}

export const ORBIT_HUB_META: Record<OrbitHubType, { label: string; icon: string; color: string; description: string }> = {
  ideas: {
    label: "Ideas",
    icon: "💡",
    color: "#a855f7",
    description: "Submit and vote on new ideas",
  },
  development: {
    label: "Development",
    icon: "⚙",
    color: "#3b82f6",
    description: "Tasks in active development",
  },
  testing: {
    label: "Testing",
    icon: "🧪",
    color: "#22c55e",
    description: "Quality assurance and testing",
  },
  review: {
    label: "Review",
    icon: "👀",
    color: "#f59e0b",
    description: "Code review and approval",
  },
  completed: {
    label: "Completed",
    icon: "✅",
    color: "#22c55e",
    description: "Finished and delivered work",
  },
};

export const IDEA_PRIORITY_COLORS: Record<IdeaPriority, string> = {
  low: "#71717a",
  medium: "#3b82f6",
  high: "#f59e0b",
  critical: "#ef4444",
};

export const IDEA_STATUS_META: Record<IdeaStatus, { label: string; color: string }> = {
  backlog: { label: "Backlog", color: "#71717a" },
  draft: { label: "Draft", color: "#71717a" },
  submitted: { label: "Submitted", color: "#3b82f6" },
  planned: { label: "Planned", color: "#8b5cf6" },
  approved: { label: "Approved", color: "#22c55e" },
  development: { label: "Development", color: "#3b82f6" },
  testing: { label: "Testing", color: "#a855f7" },
  review: { label: "Review", color: "#f59e0b" },
  completed: { label: "Completed", color: "#22c55e" },
  rejected: { label: "Rejected", color: "#ef4444" },
  archived: { label: "Archived", color: "#71717a" },
};

export const IDEA_CATEGORIES = [
  "Feature",
  "Bug",
  "UI/UX",
  "Performance",
  "Security",
  "Documentation",
  "Research",
  "Other",
] as const;

export const IDEA_DEFAULT_TAGS = [
  "AI",
  "Frontend",
  "Backend",
  "Database",
  "Security",
  "API",
  "UI",
  "Testing",
  "DevOps",
] as const;

export const RISK_TYPE_LABELS: Record<RiskType, string> = {
  blocked_task: "Blocked Task",
  overdue_work: "Overdue Work",
  missing_review: "Missing Review",
  high_priority_bug: "High Priority Bug",
  critical_issue: "Critical Issue",
  failed_testing: "Failed Testing",
  dependency_conflict: "Dependency Conflict",
  performance: "Performance",
  security: "Security",
  resource: "Resource",
};
