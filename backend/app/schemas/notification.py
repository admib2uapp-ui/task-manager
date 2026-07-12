from __future__ import annotations

import uuid
from datetime import datetime

from app.schemas.common import CamelModel, ORMModel


class NotificationRead(ORMModel):
    id: uuid.UUID
    type: str
    title: str
    body: str | None
    entity_type: str | None
    entity_id: uuid.UUID | None
    is_read: bool
    created_at: datetime


class NotificationList(CamelModel):
    items: list[NotificationRead]
    unread_count: int
