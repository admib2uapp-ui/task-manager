from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.repositories.project_repository import ProjectRepository
from app.repositories.task_repository import TaskRepository
from app.repositories.time_entry_repository import TimeEntryRepository
from app.schemas.time_entry import (
    ManualEntryRequest,
    ProjectTimeBreakdown,
    TimeEntryRead,
    TimerStartRequest,
    TimeSummary,
)


class TimeService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.entries = TimeEntryRepository(session)
        self.tasks = TaskRepository(session)
        self.projects = ProjectRepository(session)

    # ------------------------------ mapping ----------------------------
    @staticmethod
    def to_read(entry: TimeEntry) -> TimeEntryRead:
        read = TimeEntryRead.model_validate(entry)
        read.task_title = entry.task.title if entry.task else None
        read.project_name = entry.project.name if entry.project else None
        read.project_color = entry.project.color if entry.project else None
        read.is_running = entry.ended_at is None
        return read

    async def _resolve_project(
        self,
        workspace_id: uuid.UUID,
        task_id: uuid.UUID | None,
        project_id: uuid.UUID | None,
    ) -> uuid.UUID | None:
        if task_id is not None:
            task = await self.tasks.get_in_workspace(task_id, workspace_id)
            if task is None:
                raise BadRequestError("Task not found in workspace")
            return task.project_id
        if project_id is not None:
            project = await self.projects.get_in_workspace(project_id, workspace_id)
            if project is None:
                raise BadRequestError("Project not found in workspace")
            return project_id
        return None

    async def _recompute_task(self, task_id: uuid.UUID | None) -> None:
        if task_id is None:
            return
        total = await self.entries.sum_for_task(task_id)
        task = await self.session.get(Task, task_id)
        if task is not None:
            task.time_spent_seconds = total

    # ------------------------------ timer -------------------------------
    async def get_running(self, user_id: uuid.UUID) -> TimeEntryRead | None:
        entry = await self.entries.get_running(user_id)
        return self.to_read(entry) if entry else None

    async def start(
        self,
        user_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: TimerStartRequest,
    ) -> TimeEntryRead:
        # Stop any currently running timer first.
        await self._stop_running(user_id)

        project_id = await self._resolve_project(
            workspace_id, data.task_id, data.project_id
        )
        entry = TimeEntry(
            user_id=user_id,
            task_id=data.task_id,
            project_id=project_id,
            description=data.description,
            started_at=datetime.now(UTC),
        )
        self.session.add(entry)
        await self.session.flush()
        refreshed = await self.entries.get_loaded(entry.id)
        assert refreshed is not None
        return self.to_read(refreshed)

    async def _stop_running(self, user_id: uuid.UUID) -> TimeEntry | None:
        running = await self.entries.get_running(user_id)
        if running is None:
            return None
        now = datetime.now(UTC)
        started = running.started_at
        if started.tzinfo is None:
            started = started.replace(tzinfo=UTC)
        running.ended_at = now
        running.duration_seconds = max(0, int((now - started).total_seconds()))
        await self.session.flush()
        await self._recompute_task(running.task_id)
        return running

    async def stop(self, user_id: uuid.UUID) -> TimeEntryRead:
        stopped = await self._stop_running(user_id)
        if stopped is None:
            raise NotFoundError("No running timer")
        refreshed = await self.entries.get_loaded(stopped.id)
        assert refreshed is not None
        return self.to_read(refreshed)

    # --------------------------- manual entry ---------------------------
    async def create_manual(
        self,
        user_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: ManualEntryRequest,
    ) -> TimeEntryRead:
        project_id = await self._resolve_project(
            workspace_id, data.task_id, data.project_id
        )
        duration = int((data.ended_at - data.started_at).total_seconds())
        entry = TimeEntry(
            user_id=user_id,
            task_id=data.task_id,
            project_id=project_id,
            description=data.description,
            started_at=data.started_at,
            ended_at=data.ended_at,
            duration_seconds=max(0, duration),
        )
        self.session.add(entry)
        await self.session.flush()
        await self._recompute_task(data.task_id)
        refreshed = await self.entries.get_loaded(entry.id)
        assert refreshed is not None
        return self.to_read(refreshed)

    async def list_recent(
        self, user_id: uuid.UUID, limit: int = 20
    ) -> list[TimeEntryRead]:
        entries = await self.entries.list_recent(user_id, limit)
        return [self.to_read(e) for e in entries]

    async def delete(self, entry_id: uuid.UUID, user_id: uuid.UUID) -> None:
        entry = await self.entries.get(entry_id)
        if entry is None or entry.user_id != user_id:
            raise NotFoundError("Time entry not found")
        task_id = entry.task_id
        await self.session.delete(entry)
        await self.session.flush()
        await self._recompute_task(task_id)

    # ----------------------------- summary ------------------------------
    async def summary(self, user_id: uuid.UUID) -> TimeSummary:
        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=6)
        month_start = today_start - timedelta(days=29)
        tomorrow = today_start + timedelta(days=1)

        today = await self.entries.sum_between(user_id, today_start, tomorrow)
        week = await self.entries.sum_between(user_id, week_start, tomorrow)
        month = await self.entries.sum_between(user_id, month_start, tomorrow)

        recent = await self.entries.list_completed_since(user_id, month_start)
        buckets: dict[uuid.UUID | None, ProjectTimeBreakdown] = {}
        for entry in recent:
            key = entry.project_id
            if key not in buckets:
                buckets[key] = ProjectTimeBreakdown(
                    project_id=key,
                    project_name=entry.project.name if entry.project else "No project",
                    project_color=entry.project.color if entry.project else "#71717a",
                    seconds=0,
                )
            buckets[key].seconds += entry.duration_seconds

        per_project = sorted(buckets.values(), key=lambda b: b.seconds, reverse=True)
        return TimeSummary(
            today_seconds=today,
            week_seconds=week,
            month_seconds=month,
            per_project=per_project,
        )
