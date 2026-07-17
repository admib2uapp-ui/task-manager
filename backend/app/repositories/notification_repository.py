from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import func, select, update

from app.models.notification import Notification
from app.repositories.base import BaseRepository


class NotificationRepository(BaseRepository[Notification]):
    model = Notification

    async def list_for_user(
        self, user_id: uuid.UUID, limit: int = 50
    ) -> list[Notification]:
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def unread_count(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
        )
        return int(await self.session.scalar(stmt) or 0)

    async def exists_since(
        self,
        user_id: uuid.UUID,
        entity_id: uuid.UUID,
        type_: str,
        since: datetime,
    ) -> bool:
        stmt = select(Notification.id).where(
            Notification.user_id == user_id,
            Notification.entity_id == entity_id,
            Notification.notification_type == type_,
            Notification.created_at >= since,
        )
        return (await self.session.scalar(stmt)) is not None

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.session.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            )
            .values(is_read=True)
        )
