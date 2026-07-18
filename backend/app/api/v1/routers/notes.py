from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.core.deps import CurrentUser, CurrentUserRole, CurrentWorkspace, DbSession
from app.schemas.common import MessageResponse
from app.schemas.note import NoteCreate, NoteRead, NoteSummary, NoteUpdate
from app.services.note_service import NoteService

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteSummary])
async def list_notes(workspace: CurrentWorkspace, db: DbSession) -> list[NoteSummary]:
    service = NoteService(db)
    return await service.list_notes(workspace.id)


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note(
    payload: NoteCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
) -> NoteRead:
    service = NoteService(db)
    return await service.create(workspace.id, payload, current_user_id=current_user.id)


@router.get("/{note_id}", response_model=NoteRead)
async def get_note(
    note_id: uuid.UUID, workspace: CurrentWorkspace, db: DbSession
) -> NoteRead:
    service = NoteService(db)
    return await service.get(note_id, workspace.id)


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: uuid.UUID,
    payload: NoteUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> NoteRead:
    service = NoteService(db)
    uid = current_user.id
    return await service.update(
        note_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )


@router.delete("/{note_id}", response_model=MessageResponse)
async def delete_note(
    note_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> MessageResponse:
    service = NoteService(db)
    await service.delete(
        note_id, workspace.id, current_user_id=current_user.id,
        member_role=current_member.role,
    )
    return MessageResponse(message="Note deleted")
