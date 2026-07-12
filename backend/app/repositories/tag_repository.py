from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import select

from app.models.tag import Tag
from app.repositories.base import BaseRepository


class TagRepository(BaseRepository[Tag]):
    model = Tag

    async def list_by_workspace(self, workspace_id: uuid.UUID) -> list[Tag]:
        stmt = select(Tag).where(Tag.workspace_id == workspace_id).order_by(Tag.name)
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_by_name(self, workspace_id: uuid.UUID, name: str) -> Tag | None:
        stmt = select(Tag).where(Tag.workspace_id == workspace_id, Tag.name == name)
        return await self.session.scalar(stmt)

    async def get_many(
        self, workspace_id: uuid.UUID, ids: Sequence[uuid.UUID]
    ) -> list[Tag]:
        if not ids:
            return []
        stmt = select(Tag).where(Tag.workspace_id == workspace_id, Tag.id.in_(ids))
        result = await self.session.scalars(stmt)
        return list(result.all())
