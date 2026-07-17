from __future__ import annotations

import uuid

from fastapi import APIRouter, status

from app.core.deps import CurrentWorkspace, DbSession
from app.schemas.common import MessageResponse
from app.schemas.project import TagCreate, TagRead, TagUpdate
from app.services.tag_service import TagService

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagRead])
async def list_tags(workspace: CurrentWorkspace, db: DbSession) -> list[TagRead]:
    service = TagService(db)
    return await service.list_tags(workspace.id)


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    payload: TagCreate, workspace: CurrentWorkspace, db: DbSession
) -> TagRead:
    service = TagService(db)
    return await service.create(workspace.id, payload)


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: uuid.UUID,
    payload: TagUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> TagRead:
    service = TagService(db)
    return await service.update(tag_id, workspace.id, payload)


@router.delete("/{tag_id}", response_model=MessageResponse)
async def delete_tag(
    tag_id: uuid.UUID, workspace: CurrentWorkspace, db: DbSession
) -> MessageResponse:
    service = TagService(db)
    await service.delete(tag_id, workspace.id)
    return MessageResponse(message="Tag deleted")
