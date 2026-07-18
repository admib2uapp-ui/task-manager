from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.auth import UserRead
from app.schemas.common import CamelModel, ORMModel


class NoteRead(ORMModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    project_id: uuid.UUID | None
    title: str
    content: str
    created_by: uuid.UUID | None = None
    creator: UserRead | None = None
    updated_by: uuid.UUID | None = None
    updater: UserRead | None = None
    created_at: datetime
    updated_at: datetime


class NoteSummary(ORMModel):
    id: uuid.UUID
    project_id: uuid.UUID | None
    title: str
    created_by: uuid.UUID | None = None
    updated_at: datetime


class NoteCreate(CamelModel):
    title: str = Field(default="Untitled", min_length=1, max_length=200)
    content: str = ""
    project_id: uuid.UUID | None = None


class NoteUpdate(CamelModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None
    project_id: uuid.UUID | None = None
