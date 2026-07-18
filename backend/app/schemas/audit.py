from __future__ import annotations

import uuid
from datetime import datetime

from app.schemas.auth import UserRead
from app.schemas.common import ORMModel


class AuditLogRead(ORMModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    user: UserRead | None = None
    action: str
    entity_type: str
    entity_id: uuid.UUID | None = None
    details: dict | None = None
    timestamp: datetime
    created_at: datetime
