from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.auth import UserRead
from app.schemas.common import CamelModel, ORMModel

ProjectStatus = Literal["active", "paused", "completed", "archived"]

HEX_PATTERN = r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$"


# ------------------------------- Tags --------------------------------------
class TagRead(ORMModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    color: str


class TagCreate(CamelModel):
    name: str = Field(min_length=1, max_length=50)
    color: str = Field(default="#3b82f6", pattern=HEX_PATTERN)


class TagUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    color: str | None = Field(default=None, pattern=HEX_PATTERN)


# ---------------------------- Milestones -----------------------------------
class MilestoneRead(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    description: str | None
    due_date: datetime | None
    completed: bool
    position: float
    created_by: uuid.UUID | None = None
    updated_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class MilestoneCreate(CamelModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    due_date: datetime | None = None
    position: float | None = None


class MilestoneUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    due_date: datetime | None = None
    completed: bool | None = None
    position: float | None = None


# ----------------------------- Projects ------------------------------------
class ProjectRead(ORMModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None
    color: str
    icon: str
    status: ProjectStatus
    deadline: datetime | None
    repository_url: str | None
    is_favorite: bool
    is_archived: bool
    tags: list[TagRead] = []
    milestones: list[MilestoneRead] = []
    # computed
    progress: int = 0
    milestone_count: int = 0
    completed_milestone_count: int = 0
    task_count: int = 0
    completed_task_count: int = 0
    created_by: uuid.UUID | None = None
    creator: UserRead | None = None
    updated_by: uuid.UUID | None = None
    updater: UserRead | None = None
    created_at: datetime
    updated_at: datetime


class ProjectCreate(CamelModel):
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    color: str = Field(default="#3b82f6", pattern=HEX_PATTERN)
    icon: str = Field(default="folder", max_length=40)
    status: ProjectStatus = "active"
    deadline: datetime | None = None
    repository_url: str | None = Field(default=None, max_length=1024)
    tag_ids: list[uuid.UUID] = []


class ProjectUpdate(CamelModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    color: str | None = Field(default=None, pattern=HEX_PATTERN)
    icon: str | None = Field(default=None, max_length=40)
    status: ProjectStatus | None = None
    deadline: datetime | None = None
    repository_url: str | None = Field(default=None, max_length=1024)
    is_favorite: bool | None = None
    is_archived: bool | None = None
    tag_ids: list[uuid.UUID] | None = None
