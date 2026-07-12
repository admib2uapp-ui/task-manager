from __future__ import annotations

import uuid

from app.schemas.common import CamelModel


class SearchProject(CamelModel):
    id: uuid.UUID
    name: str
    color: str
    icon: str


class SearchTask(CamelModel):
    id: uuid.UUID
    title: str
    project_id: uuid.UUID
    project_name: str
    project_color: str
    status: str
    priority: str


class SearchResponse(CamelModel):
    projects: list[SearchProject]
    tasks: list[SearchTask]
