from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import ColumnElement, Select, func, or_, select
from sqlalchemy.orm import selectinload

from app.models.associations import task_tags
from app.models.comment import Comment
from app.models.project import Project
from app.models.task import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    model = Task

    def _workspace_scoped(self, workspace_id: uuid.UUID) -> Select[tuple[Task]]:
        return (
            select(Task)
            .join(Project, Task.project_id == Project.id)
            .where(Project.workspace_id == workspace_id)
        )

    async def list_for_workspace(
        self,
        workspace_id: uuid.UUID,
        *,
        project_id: uuid.UUID | None = None,
        status: str | None = None,
        priority: str | None = None,
        assignee_id: uuid.UUID | None = None,
        tag_id: uuid.UUID | None = None,
        search: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Task]:
        stmt = self._workspace_scoped(workspace_id)

        if project_id is not None:
            stmt = stmt.where(Task.project_id == project_id)
        if status is not None:
            stmt = stmt.where(Task.status == status)
        if priority is not None:
            stmt = stmt.where(Task.priority == priority)
        if assignee_id is not None:
            stmt = stmt.where(Task.assignee_id == assignee_id)
        if tag_id is not None:
            stmt = stmt.where(
                Task.id.in_(
                    select(task_tags.c.task_id).where(task_tags.c.tag_id == tag_id)
                )
            )
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Task.title).like(like),
                    func.lower(func.coalesce(Task.description, "")).like(like),
                )
            )

        stmt = stmt.order_by(Task.position, Task.created_at)
        if offset is not None:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)
        result = await self.session.scalars(stmt)
        return list(result.unique().all())

    async def get_in_workspace(
        self, task_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Task | None:
        stmt = self._workspace_scoped(workspace_id).where(Task.id == task_id)
        return await self.session.scalar(stmt)

    async def get_detail_in_workspace(
        self, task_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Task | None:
        stmt = (
            self._workspace_scoped(workspace_id)
            .where(Task.id == task_id)
            .options(
                selectinload(Task.comments).selectinload(Comment.author),
                selectinload(Task.dependencies),
            )
        )
        return await self.session.scalar(stmt)

    async def next_position(self, project_id: uuid.UUID, status: str) -> float:
        stmt = select(func.coalesce(func.max(Task.position), 0)).where(
            Task.project_id == project_id, Task.status == status
        )
        current = await self.session.scalar(stmt)
        return float(current or 0) + 1024.0

    async def count_for_project(self, project_id: uuid.UUID) -> tuple[int, int]:
        total = await self.session.scalar(
            select(func.count()).select_from(Task).where(Task.project_id == project_id)
        )
        done = await self.session.scalar(
            select(func.count())
            .select_from(Task)
            .where(Task.project_id == project_id, Task.status == "done")
        )
        return int(total or 0), int(done or 0)

    # ---------------------------- dashboard -----------------------------
    async def list_due_between(
        self, workspace_id: uuid.UUID, start: datetime, end: datetime
    ) -> list[Task]:
        stmt = (
            self._workspace_scoped(workspace_id)
            .where(
                Task.deadline >= start,
                Task.deadline < end,
                Task.status != "done",
            )
            .order_by(Task.deadline)
        )
        result = await self.session.scalars(stmt)
        return list(result.unique().all())

    async def list_upcoming(
        self,
        workspace_id: uuid.UUID,
        after: datetime,
        until: datetime,
        limit: int,
    ) -> list[Task]:
        stmt = (
            self._workspace_scoped(workspace_id)
            .where(
                Task.deadline > after,
                Task.deadline <= until,
                Task.status != "done",
            )
            .order_by(Task.deadline)
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.unique().all())

    async def list_recent(self, workspace_id: uuid.UUID, limit: int) -> list[Task]:
        stmt = (
            self._workspace_scoped(workspace_id)
            .order_by(Task.updated_at.desc())
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.unique().all())

    async def _count(
        self, workspace_id: uuid.UUID, *conditions: ColumnElement[bool]
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(Task)
            .join(Project, Task.project_id == Project.id)
            .where(Project.workspace_id == workspace_id, *conditions)
        )
        return int(await self.session.scalar(stmt) or 0)

    async def metrics(
        self,
        workspace_id: uuid.UUID,
        *,
        now: datetime,
        today_start: datetime,
        today_end: datetime,
    ) -> dict[str, int]:
        total = await self._count(workspace_id)
        done = await self._count(workspace_id, Task.status == "done")
        overdue = await self._count(
            workspace_id, Task.deadline < now, Task.status != "done"
        )
        due_today = await self._count(
            workspace_id,
            Task.deadline >= today_start,
            Task.deadline < today_end,
            Task.status != "done",
        )
        return {
            "total": total,
            "done": done,
            "pending": total - done,
            "overdue": overdue,
            "due_today": due_today,
        }
