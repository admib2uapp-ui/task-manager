import { api } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────

export type TokenType = "oauth" | "pat";
export type ScanType = "full" | "incremental";
export type ScanStatus = "pending" | "running" | "completed" | "failed";
export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type ReportType =
  | "executive"
  | "security"
  | "architecture"
  | "code_quality"
  | "performance"
  | "code_review";

export interface RepositoryConnection {
  id: string;
  workspaceId: string;
  projectId: string | null;
  githubOwner: string;
  githubRepo: string;
  provider: string;
  tokenType: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  repoInfo: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryScan {
  id: string;
  connectionId: string;
  scanType: string;
  status: string;
  taskId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  commitHash: string | null;
  commitMessage: string | null;
  fileCount: number;
  totalLines: number;
  totalSizeBytes: number;
  languageBreakdown: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface CodeIssue {
  id: string;
  scanId: string;
  filePath: string;
  lineStart: number | null;
  lineEnd: number | null;
  issueType: string;
  severity: string;
  category: string;
  title: string;
  message: string | null;
  suggestion: string | null;
  language: string | null;
  ruleId: string | null;
  extraData: Record<string, unknown> | null;
  isResolved: boolean;
  createdAt: string;
}

export interface RepositoryScore {
  id: string;
  scanId: string;
  workspaceId: string;
  overall: number;
  architecture: number;
  codeQuality: number;
  security: number;
  performance: number;
  testing: number;
  documentation: number;
  maintainability: number;
  technicalDebt: number;
  complexity: number;
  dxScore: number;
}

export interface GitHubRepoInfo {
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  language: string | null;
  topics: string[];
  isPrivate: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  sizeKb: number;
}

export interface GitHubBranch {
  name: string;
  sha: string;
}

export interface GitHubContributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface GitHubLanguages {
  languages: Record<string, number>;
  totalBytes: number;
}

export interface FileTreeItem {
  path: string;
  type: "tree" | "blob";
  size: number;
  url: string | null;
}

export interface AIReportRead {
  id: string;
  scanId: string;
  workspaceId: string;
  reportType: string;
  title: string;
  summary: string | null;
  fullContent: string | null;
  scores: Record<string, unknown> | null;
  generatedBy: string | null;
  extraData: Record<string, unknown> | null;
  createdAt: string;
}

// ── API ──────────────────────────────────────────────────────────────

export const repositoriesApi = {
  // Connections
  list: () => api.get<RepositoryConnection[]>("/repositories"),

  connect: (payload: {
    githubOwner: string;
    githubRepo: string;
    projectId?: string | null;
    tokenType?: TokenType;
    accessToken?: string | null;
  }) => api.post<RepositoryConnection>("/repositories/connect", payload),

  get: (id: string) => api.get<RepositoryConnection>(`/repositories/${id}`),

  update: (id: string, payload: Record<string, unknown>) =>
    api.patch<RepositoryConnection>(`/repositories/${id}`, payload),

  disconnect: (id: string) =>
    api.delete<{ message: string }>(`/repositories/${id}`),

  validate: (id: string) =>
    api.post<{ valid: boolean }>(`/repositories/${id}/validate`),

  // Metadata
  repoInfo: (id: string) =>
    api.get<GitHubRepoInfo>(`/repositories/${id}/repo-info`),

  branches: (id: string) =>
    api.get<GitHubBranch[]>(`/repositories/${id}/branches`),

  contributors: (id: string) =>
    api.get<GitHubContributor[]>(`/repositories/${id}/contributors`),

  languages: (id: string) =>
    api.get<GitHubLanguages>(`/repositories/${id}/languages`),

  // Scans
  scans: (id: string) => api.get<RepositoryScan[]>(`/repositories/${id}/scans`),

  triggerScan: (id: string, scanType: ScanType = "full") =>
    api.post<RepositoryScan>(`/repositories/${id}/scan`, { scanType }),

  getScan: (connectionId: string, scanId: string) =>
    api.get<RepositoryScan>(`/repositories/${connectionId}/scans/${scanId}`),

  // File Tree
  fileTree: (id: string, branch?: string) =>
    api.get<FileTreeItem[]>(
      `/repositories/${id}/file-tree${branch ? `?branch=${encodeURIComponent(branch)}` : ""}`,
    ),

  // AI Analysis
  analyze: (id: string, reportType: ReportType = "executive") =>
    api.post<{
      reportType: string;
      title: string;
      content: Record<string, unknown>;
    }>(`/repositories/${id}/analyze`, { reportType }),

  // Code Issues
  codeIssues: (id: string, params?: { severity?: string; category?: string }) =>
    api.get<CodeIssue[]>(`/repositories/${id}/issues`, { params }),

  // AI Reports
  aiReports: (id: string) =>
    api.get<AIReportRead[]>(`/repositories/${id}/reports`),

  // Score
  score: (id: string) =>
    api.get<RepositoryScore | null>(`/repositories/${id}/score`),
};
