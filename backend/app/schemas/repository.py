from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import Field

from app.schemas.common import CamelModel, ORMModel

TokenType = Literal["oauth", "pat"]
ScanType = Literal["full", "incremental"]
ScanStatus = Literal["pending", "running", "completed", "failed"]
Severity = Literal["critical", "high", "medium", "low", "info"]
ReportType = Literal[
    "executive", "security", "architecture",
    "code_quality", "performance", "code_review",
]


# ── Repository Connection ────────────────────────────────────────────


class RepositoryConnectRequest(CamelModel):
    github_owner: str = Field(min_length=1, max_length=100)
    github_repo: str = Field(min_length=1, max_length=100)
    project_id: uuid.UUID | None = None
    token_type: TokenType = "oauth"
    access_token: str | None = Field(default=None, min_length=1)


class RepositoryConnectionRead(ORMModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    project_id: uuid.UUID | None
    github_owner: str
    github_repo: str
    provider: str
    token_type: str
    is_active: bool
    last_synced_at: datetime | None
    repo_info: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime


class RepositoryConnectionUpdate(CamelModel):
    project_id: uuid.UUID | None = None
    access_token: str | None = None
    is_active: bool | None = None


# ── Repository Scan ───────────────────────────────────────────────────


class RepositoryScanRead(ORMModel):
    id: uuid.UUID
    connection_id: uuid.UUID
    scan_type: str
    status: str
    task_id: str | None
    started_at: datetime | None
    completed_at: datetime | None
    commit_hash: str | None
    commit_message: str | None
    file_count: int
    total_lines: int
    total_size_bytes: int
    language_breakdown: dict[str, Any] | None
    error_message: str | None
    created_at: datetime


class ScanTriggerRequest(CamelModel):
    scan_type: ScanType = "full"


class ScanProgressResponse(CamelModel):
    status: str
    current: int = 0
    total: int = 0
    percent: int = 0
    stage: str = ""


# ── Code Issues ───────────────────────────────────────────────────────


class CodeIssueRead(ORMModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    file_path: str
    line_start: int | None
    line_end: int | None
    issue_type: str
    severity: str
    category: str
    title: str
    message: str | None
    suggestion: str | None
    language: str | None
    rule_id: str | None
    extra_data: dict[str, Any] | None
    is_resolved: bool
    created_at: datetime


class CodeIssueUpdate(CamelModel):
    is_resolved: bool | None = None


# ── Metrics ───────────────────────────────────────────────────────────


class RepositoryMetricRead(ORMModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    metric_name: str
    metric_value: float
    category: str | None
    dimension: str | None
    extra_data: dict[str, Any] | None


# ── Scores ────────────────────────────────────────────────────────────


class RepositoryScoreRead(ORMModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    workspace_id: uuid.UUID
    overall: float
    architecture: float
    code_quality: float
    security: float
    performance: float
    testing: float
    documentation: float
    maintainability: float
    technical_debt: float
    complexity: float
    dx_score: float


# ── AI Reports ────────────────────────────────────────────────────────


class ReportGenerateRequest(CamelModel):
    report_type: ReportType = "executive"


class AIRepositoryReportRead(ORMModel):
    id: uuid.UUID
    scan_id: uuid.UUID
    workspace_id: uuid.UUID
    report_type: str
    title: str
    summary: str | None
    full_content: str | None
    scores: dict[str, Any] | None
    generated_by: str | None
    extra_data: dict[str, Any] | None
    created_at: datetime


# ── AI Chat ───────────────────────────────────────────────────────────


class ChatRequest(CamelModel):
    question: str = Field(min_length=1, max_length=4000)


class ChatMessageRead(ORMModel):
    id: uuid.UUID
    connection_id: uuid.UUID
    user_id: uuid.UUID
    question: str
    answer: str | None
    model: str | None
    created_at: datetime


# ── Task Generation ───────────────────────────────────────────────────


class TaskGenerationRequest(CamelModel):
    report_type: ReportType | None = None
    min_severity: Severity = "medium"
    max_tasks: int = Field(default=10, ge=1, le=50)


class GeneratedTask(CamelModel):
    title: str
    description: str | None
    priority: str
    estimated_hours: float | None
    checklist: list[str] = []
    affected_files: list[str] = []
    severity: str
    category: str


class TaskGenerationResponse(CamelModel):
    tasks: list[GeneratedTask]
    created_task_ids: list[uuid.UUID] = []


# ── GitHub Metadata ───────────────────────────────────────────────────


class GitHubRepoInfo(CamelModel):
    full_name: str
    description: str | None
    stars: int
    forks: int
    open_issues: int
    default_branch: str
    language: str | None
    topics: list[str]
    is_private: bool
    created_at: str | None
    updated_at: str | None
    pushed_at: str | None
    size_kb: int


class GitHubBranch(CamelModel):
    name: str
    sha: str


class GitHubContributor(CamelModel):
    login: str
    avatar_url: str
    contributions: int


class GitHubLanguages(CamelModel):
    languages: dict[str, int]
    total_bytes: int
