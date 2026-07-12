from __future__ import annotations

import uuid

from sqlalchemy import func, select

from app.models.milestone import Milestone
from app.repositories.base import BaseRepository


class MilestoneRepository(BaseRepository[Milestone]):
    model = Milestone

    async def list_by_project(self, project_id: uuid.UUID) -> list[Milestone]:
        stmt = (
            select(Milestone)
            .where(Milestone.project_id == project_id)
            .order_by(Milestone.position, Milestone.created_at)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def next_position(self, project_id: uuid.UUID) -> float:
        stmt = select(func.coalesce(func.max(Milestone.position), 0)).where(
            Milestone.project_id == project_id
        )
        current = await self.session.scalar(stmt)
        return float(current or 0) + 1024.0
