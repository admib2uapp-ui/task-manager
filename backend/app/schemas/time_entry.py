from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field, model_validator

from app.schemas.common import CamelModel, ORMModel


class TimeEntryRead(ORMModel):
    id: uuid.UUID
    task_id: uuid.UUID | None
    task_title: str | None = None
    project_id: uuid.UUID | None
    project_name: str | None = None
    project_color: str | None = None
    description: str | None
    started_at: datetime
    ended_at: datetime | None
    duration_seconds: int
    is_running: bool
    created_at: datetime


class TimerStartRequest(CamelModel):
    task_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    description: str | None = Field(default=None, max_length=500)


class ManualEntryRequest(CamelModel):
    task_id: uuid.UUID | None = None
    project_id: uuid.UUID | None = None
    description: str | None = Field(default=None, max_length=500)
    started_at: datetime
    ended_at: datetime

    @model_validator(mode="after")
    def _check_range(self) -> ManualEntryRequest:
        if self.ended_at <= self.started_at:
            raise ValueError("ended_at must be after started_at")
        return self


class ProjectTimeBreakdown(CamelModel):
    project_id: uuid.UUID | None
    project_name: str
    project_color: str
    seconds: int


class TimeSummary(CamelModel):
    today_seconds: int
    week_seconds: int
    month_seconds: int
    per_project: list[ProjectTimeBreakdown]
