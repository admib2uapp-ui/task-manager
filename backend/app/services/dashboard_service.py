from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.project_repository import ProjectRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.dashboard import DashboardResponse, DashboardStats
from app.services.project_service import ProjectService
from app.services.task_service import TaskService


class DashboardService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.tasks = TaskRepository(session)
        self.projects = ProjectRepository(session)

    async def summary(self, workspace_id: uuid.UUID) -> DashboardResponse:
        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        week_end = today_start + timedelta(days=7)

        metrics = await self.tasks.metrics(
            workspace_id,
            now=now,
            today_start=today_start,
            today_end=today_end,
        )

        today = await self.tasks.list_due_between(workspace_id, today_start, today_end)
        upcoming = await self.tasks.list_upcoming(
            workspace_id, today_end, week_end, limit=8
        )
        recent_tasks = await self.tasks.list_recent(workspace_id, limit=6)

        all_projects = await self.projects.list_by_workspace(workspace_id)
        active_projects = sum(1 for p in all_projects if p.status == "active")
        recent_projects = all_projects[:5]

        completion_rate = (
            round(metrics["done"] / metrics["total"] * 100) if metrics["total"] else 0
        )

        stats = DashboardStats(
            active_projects=active_projects,
            total_tasks=metrics["total"],
            completed_tasks=metrics["done"],
            pending_tasks=metrics["pending"],
            overdue_tasks=metrics["overdue"],
            due_today=metrics["due_today"],
            tracked_today_seconds=0,  # populated in the time-tracking phase
            completion_rate=completion_rate,
        )

        return DashboardResponse(
            stats=stats,
            today_tasks=[TaskService.to_read(t) for t in today],
            upcoming_deadlines=[TaskService.to_read(t) for t in upcoming],
            recent_projects=[ProjectService.to_read(p) for p in recent_projects],
            recent_tasks=[TaskService.to_read(t) for t in recent_tasks],
        )
