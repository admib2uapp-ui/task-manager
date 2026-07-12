from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.auth import UserRead
from app.schemas.common import CamelModel, ORMModel
from app.schemas.project import TagRead

TaskStatus = Literal["backlog", "todo", "in_progress", "review", "done"]
TaskPriority = Literal["critical", "high", "medium", "low"]


# ------------------------------ Subtasks -----------------------------------
class SubtaskRead(ORMModel):
    id: uuid.UUID
    task_id: uuid.UUID
    title: str
    completed: bool
    position: float


class SubtaskCreate(CamelModel):
    title: str = Field(min_length=1, max_length=300)


class SubtaskUpdate(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    completed: bool | None = None
    position: float | None = None


# --------------------------- Checklist items --------------------------------
class ChecklistItemRead(ORMModel):
    id: uuid.UUID
    task_id: uuid.UUID
    content: str
    completed: bool
    position: float


class ChecklistItemCreate(CamelModel):
    content: str = Field(min_length=1, max_length=500)


class ChecklistItemUpdate(CamelModel):
    content: str | None = Field(default=None, min_length=1, max_length=500)
    completed: bool | None = None
    position: float | None = None


# ------------------------------ Comments ------------------------------------
class CommentRead(ORMModel):
    id: uuid.UUID
    task_id: uuid.UUID
    author_id: uuid.UUID | None
    author: UserRead | None = None
    body: str
    created_at: datetime
    updated_at: datetime


class CommentCreate(CamelModel):
    body: str = Field(min_length=1, max_length=5000)


# ------------------------------ Project ref ---------------------------------
class ProjectRef(ORMModel):
    id: uuid.UUID
    name: str
    color: str
    icon: str


# -------------------------------- Tasks -------------------------------------
class TaskRead(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    project: ProjectRef | None = None
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    position: float
    assignee_id: uuid.UUID | None
    assignee: UserRead | None = None
    deadline: datetime | None
    estimated_hours: float | None
    time_spent_seconds: int
    github_repo_url: str | None
    github_issue_url: str | None
    github_pr_url: str | None
    github_branch: str | None
    is_pinned: bool
    tags: list[TagRead] = []
    subtasks: list[SubtaskRead] = []
    checklist: list[ChecklistItemRead] = []
    created_at: datetime
    updated_at: datetime


class TaskDetail(TaskRead):
    comments: list[CommentRead] = []
    dependency_ids: list[uuid.UUID] = []


class TaskCreate(CamelModel):
    project_id: uuid.UUID
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    status: TaskStatus = "backlog"
    priority: TaskPriority = "medium"
    assignee_id: uuid.UUID | None = None
    deadline: datetime | None = None
    estimated_hours: float | None = Field(default=None, ge=0)
    tag_ids: list[uuid.UUID] = []
    github_repo_url: str | None = Field(default=None, max_length=1024)
    github_issue_url: str | None = Field(default=None, max_length=1024)
    github_pr_url: str | None = Field(default=None, max_length=1024)
    github_branch: str | None = Field(default=None, max_length=255)


class TaskUpdate(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=300)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assignee_id: uuid.UUID | None = None
    deadline: datetime | None = None
    estimated_hours: float | None = Field(default=None, ge=0)
    time_spent_seconds: int | None = Field(default=None, ge=0)
    tag_ids: list[uuid.UUID] | None = None
    github_repo_url: str | None = Field(default=None, max_length=1024)
    github_issue_url: str | None = Field(default=None, max_length=1024)
    github_pr_url: str | None = Field(default=None, max_length=1024)
    github_branch: str | None = Field(default=None, max_length=255)
    is_pinned: bool | None = None


class TaskMove(CamelModel):
    status: TaskStatus
    position: float


class DependencyCreate(CamelModel):
    depends_on_id: uuid.UUID
