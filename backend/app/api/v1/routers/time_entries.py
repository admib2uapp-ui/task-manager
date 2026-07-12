from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUser, CurrentWorkspace, DbSession
from app.schemas.common import MessageResponse
from app.schemas.time_entry import (
    ManualEntryRequest,
    TimeEntryRead,
    TimerStartRequest,
    TimeSummary,
)
from app.services.time_service import TimeService

router = APIRouter(prefix="/time-entries", tags=["time"])


@router.get("", response_model=list[TimeEntryRead])
async def list_entries(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(20, ge=1, le=100),
) -> list[TimeEntryRead]:
    service = TimeService(db)
    return await service.list_recent(current_user.id, limit)


@router.get("/running", response_model=TimeEntryRead | None)
async def running_timer(
    current_user: CurrentUser, db: DbSession
) -> TimeEntryRead | None:
    service = TimeService(db)
    return await service.get_running(current_user.id)


@router.get("/summary", response_model=TimeSummary)
async def summary(current_user: CurrentUser, db: DbSession) -> TimeSummary:
    service = TimeService(db)
    return await service.summary(current_user.id)


@router.post(
    "/start", response_model=TimeEntryRead, status_code=status.HTTP_201_CREATED
)
async def start_timer(
    payload: TimerStartRequest,
    current_user: CurrentUser,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> TimeEntryRead:
    service = TimeService(db)
    return await service.start(current_user.id, workspace.id, payload)


@router.post("/stop", response_model=TimeEntryRead)
async def stop_timer(current_user: CurrentUser, db: DbSession) -> TimeEntryRead:
    service = TimeService(db)
    return await service.stop(current_user.id)


@router.post("", response_model=TimeEntryRead, status_code=status.HTTP_201_CREATED)
async def create_manual_entry(
    payload: ManualEntryRequest,
    current_user: CurrentUser,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> TimeEntryRead:
    service = TimeService(db)
    return await service.create_manual(current_user.id, workspace.id, payload)


@router.delete("/{entry_id}", response_model=MessageResponse)
async def delete_entry(
    entry_id: uuid.UUID, current_user: CurrentUser, db: DbSession
) -> MessageResponse:
    service = TimeService(db)
    await service.delete(entry_id, current_user.id)
    return MessageResponse(message="Time entry deleted")
