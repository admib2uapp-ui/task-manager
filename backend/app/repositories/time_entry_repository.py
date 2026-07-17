from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select

from app.models.time_entry import TimeEntry
from app.repositories.base import BaseRepository


class TimeEntryRepository(BaseRepository[TimeEntry]):
    model = TimeEntry

    async def get_running(self, user_id: uuid.UUID) -> TimeEntry | None:
        stmt = (
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id, TimeEntry.ended_at.is_(None))
            .order_by(TimeEntry.started_at.desc())
            .limit(1)
        )
        return await self.session.scalar(stmt)

    async def get_loaded(self, entry_id: uuid.UUID) -> TimeEntry | None:
        """Fetch via select() so selectin relationships (task/project) load."""
        stmt = select(TimeEntry).where(TimeEntry.id == entry_id)
        return await self.session.scalar(stmt)

    async def list_recent(self, user_id: uuid.UUID, limit: int = 20) -> list[TimeEntry]:
        stmt = (
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id)
            .order_by(TimeEntry.started_at.desc())
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def list_completed_since(
        self, user_id: uuid.UUID, since: datetime
    ) -> list[TimeEntry]:
        stmt = (
            select(TimeEntry)
            .where(
                TimeEntry.user_id == user_id,
                TimeEntry.ended_at.is_not(None),
                TimeEntry.started_at >= since,
            )
            .order_by(TimeEntry.started_at.desc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def sum_for_task(self, task_id: uuid.UUID) -> int:
        stmt = select(func.coalesce(func.sum(TimeEntry.duration_seconds), 0)).where(
            TimeEntry.task_id == task_id, TimeEntry.ended_at.is_not(None)
        )
        return int(await self.session.scalar(stmt) or 0)

    async def sum_between(
        self, user_id: uuid.UUID, start: datetime, end: datetime
    ) -> int:
        stmt = select(func.coalesce(func.sum(TimeEntry.duration_seconds), 0)).where(
            TimeEntry.user_id == user_id,
            TimeEntry.ended_at.is_not(None),
            TimeEntry.started_at >= start,
            TimeEntry.started_at < end,
        )
        return int(await self.session.scalar(stmt) or 0)
