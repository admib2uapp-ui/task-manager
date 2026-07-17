from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.repositories.tag_repository import TagRepository
from app.schemas.project import TagCreate, TagRead, TagUpdate


class TagService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.tags = TagRepository(session)

    async def list_tags(self, workspace_id: uuid.UUID) -> list[TagRead]:
        tags = await self.tags.list_by_workspace(workspace_id)
        return [TagRead.model_validate(t) for t in tags]

    async def create(self, workspace_id: uuid.UUID, data: TagCreate) -> TagRead:
        existing = await self.tags.get_by_name(workspace_id, data.name)
        if existing is not None:
            raise ConflictError("A tag with this name already exists")
        tag = await self.tags.create(
            workspace_id=workspace_id, name=data.name, color=data.color
        )
        return TagRead.model_validate(tag)

    async def update(
        self, tag_id: uuid.UUID, workspace_id: uuid.UUID, data: TagUpdate
    ) -> TagRead:
        tag = await self.tags.get(tag_id)
        if tag is None or tag.workspace_id != workspace_id:
            raise NotFoundError("Tag not found")
        payload = data.model_dump(exclude_unset=True, exclude_none=True)
        if payload.get("name"):
            existing = await self.tags.get_by_name(workspace_id, payload["name"])
            if existing is not None and existing.id != tag_id:
                raise ConflictError("A tag with this name already exists")
        updated = await self.tags.update(tag, **payload)
        return TagRead.model_validate(updated)

    async def delete(self, tag_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
        tag = await self.tags.get(tag_id)
        if tag is None or tag.workspace_id != workspace_id:
            raise NotFoundError("Tag not found")
        await self.tags.delete(tag)
