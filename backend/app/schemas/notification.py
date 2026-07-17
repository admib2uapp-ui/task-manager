from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import Field

from app.schemas.common import CamelModel, ORMModel


class NotificationRead(ORMModel):
    id: uuid.UUID
    type: str = Field(validation_alias="notification_type")
    title: str
    body: str | None
    entity_type: str | None
    entity_id: uuid.UUID | None
    is_read: bool
    created_at: datetime


class NotificationList(CamelModel):
    items: list[NotificationRead]
    unread_count: int
