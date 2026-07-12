from __future__ import annotations

import uuid

from fastapi import APIRouter

from app.core.deps import CurrentUser, CurrentWorkspace, DbSession
from app.schemas.common import MessageResponse
from app.schemas.notification import NotificationList, NotificationRead
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationList)
async def list_notifications(
    current_user: CurrentUser, workspace: CurrentWorkspace, db: DbSession
) -> NotificationList:
    service = NotificationService(db)
    return await service.list(current_user.id, workspace.id)


@router.get("/unread-count", response_model=dict)
async def unread_count(current_user: CurrentUser, db: DbSession) -> dict[str, int]:
    service = NotificationService(db)
    return {"count": await service.unread_count(current_user.id)}


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> NotificationRead:
    service = NotificationService(db)
    return await service.mark_read(notification_id, current_user.id)


@router.post("/read-all", response_model=MessageResponse)
async def mark_all_read(current_user: CurrentUser, db: DbSession) -> MessageResponse:
    service = NotificationService(db)
    await service.mark_all_read(current_user.id)
    return MessageResponse(message="All notifications marked read")
