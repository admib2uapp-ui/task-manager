from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.notification import Notification
from app.models.project import Project
from app.models.task import Task
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationList, NotificationRead


class NotificationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.notifications = NotificationRepository(session)

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        type_: str,
        title: str,
        body: str | None = None,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            type=type_,
            title=title,
            body=body,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        self.session.add(notification)
        await self.session.flush()
        return notification

    async def _generate_deadline_notifications(
        self, user_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> None:
        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        rows = (
            await self.session.execute(
                select(Task.id, Task.title, Task.deadline)
                .join(Project, Task.project_id == Project.id)
                .where(
                    Project.workspace_id == workspace_id,
                    Task.status != "done",
                    Task.deadline.is_not(None),
                )
            )
        ).all()

        for task_id, title, deadline in rows:
            if deadline is None:
                continue
            dl = deadline if deadline.tzinfo else deadline.replace(tzinfo=UTC)
            if dl < today_start:
                type_, label = "overdue", "Task overdue"
            elif dl < today_start.replace(hour=23, minute=59, second=59):
                type_, label = "deadline", "Due today"
            else:
                continue

            if await self.notifications.exists_since(
                user_id, task_id, type_, today_start
            ):
                continue
            await self.create(
                user_id=user_id,
                type_=type_,
                title=label,
                body=title,
                entity_type="task",
                entity_id=task_id,
            )

    async def list(
        self, user_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> NotificationList:
        await self._generate_deadline_notifications(user_id, workspace_id)
        items = await self.notifications.list_for_user(user_id)
        unread = await self.notifications.unread_count(user_id)
        return NotificationList(
            items=[NotificationRead.model_validate(n) for n in items],
            unread_count=unread,
        )

    async def unread_count(self, user_id: uuid.UUID) -> int:
        return await self.notifications.unread_count(user_id)

    async def mark_read(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> NotificationRead:
        notification = await self.notifications.get(notification_id)
        if notification is None or notification.user_id != user_id:
            raise NotFoundError("Notification not found")
        notification.is_read = True
        await self.session.flush()
        return NotificationRead.model_validate(notification)

    async def mark_all_read(self, user_id: uuid.UUID) -> None:
        await self.notifications.mark_all_read(user_id)
