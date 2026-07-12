from __future__ import annotations

from fastapi import APIRouter, status

from app.core.deps import CurrentWorkspace, DbSession
from app.schemas.project import TagCreate, TagRead
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
