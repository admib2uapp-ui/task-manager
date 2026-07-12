from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.models.task import Task
from app.models.time_entry import TimeEntry
from app.schemas.analytics import AnalyticsOverview, AnalyticsPoint, LabelCount

DAYS = 14


def _empty_series(days: int) -> dict[str, int]:
    today = datetime.now(UTC).date()
    return {
        (today - timedelta(days=offset)).isoformat(): 0
        for offset in range(days - 1, -1, -1)
    }


class AnalyticsService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def overview(
        self, workspace_id: uuid.UUID, user_id: uuid.UUID
    ) -> AnalyticsOverview:
        # --- status distribution ---
        status_rows = (
            await self.session.execute(
                select(Task.status, func.count())
                .join(Project, Task.project_id == Project.id)
                .where(Project.workspace_id == workspace_id)
                .group_by(Task.status)
            )
        ).all()
        status_map: dict[str, int] = {
            row[0]: row[1] for row in status_rows
        }
        total = sum(status_map.values())
        completed = status_map.get("done", 0)

        # --- priority distribution ---
        priority_rows = (
            await self.session.execute(
                select(Task.priority, func.count())
                .join(Project, Task.project_id == Project.id)
                .where(Project.workspace_id == workspace_id)
                .group_by(Task.priority)
            )
        ).all()

        # --- completed tasks (for per-day + avg completion) ---
        since = datetime.now(UTC) - timedelta(days=DAYS)
        done_rows = (
            await self.session.execute(
                select(Task.created_at, Task.updated_at)
                .join(Project, Task.project_id == Project.id)
                .where(
                    Project.workspace_id == workspace_id,
                    Task.status == "done",
                )
            )
        ).all()

        completed_series = _empty_series(DAYS)
        completion_deltas: list[float] = []
        for created_at, updated_at in done_rows:
            completion_deltas.append((updated_at - created_at).total_seconds())
            key = updated_at.date().isoformat()
            if key in completed_series:
                completed_series[key] += 1

        avg_completion_hours = (
            round(sum(completion_deltas) / len(completion_deltas) / 3600, 1)
            if completion_deltas
            else 0.0
        )

        # --- hours per day (time entries, accurate) ---
        entry_rows = (
            await self.session.execute(
                select(TimeEntry.started_at, TimeEntry.duration_seconds).where(
                    TimeEntry.user_id == user_id,
                    TimeEntry.ended_at.is_not(None),
                    TimeEntry.started_at >= since,
                )
            )
        ).all()
        hours_series = _empty_series(DAYS)
        for started_at, duration in entry_rows:
            key = started_at.date().isoformat()
            if key in hours_series:
                hours_series[key] += duration

        completion_rate = round(completed / total * 100) if total else 0

        return AnalyticsOverview(
            total_tasks=total,
            completed_tasks=completed,
            pending_tasks=total - completed,
            completion_rate=completion_rate,
            avg_completion_hours=avg_completion_hours,
            status_distribution=[
                LabelCount(label=status, count=count)
                for status, count in status_map.items()
            ],
            priority_distribution=[
                LabelCount(label=priority, count=count)
                for priority, count in priority_rows
            ],
            completed_per_day=[
                AnalyticsPoint(date=date, value=value)
                for date, value in completed_series.items()
            ],
            hours_per_day=[
                AnalyticsPoint(date=date, value=value)
                for date, value in hours_series.items()
            ],
        )
