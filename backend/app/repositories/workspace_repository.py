from __future__ import annotations

import uuid

from sqlalchemy import select

from app.models.workspace import Workspace, WorkspaceMember
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    model = Workspace

    async def list_for_user(self, user_id: uuid.UUID) -> list[Workspace]:
        stmt = (
            select(Workspace)
            .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
            .where(WorkspaceMember.user_id == user_id)
            .order_by(Workspace.created_at)
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def add_member(
        self,
        *,
        workspace_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str = "member",
    ) -> WorkspaceMember:
        member = WorkspaceMember(workspace_id=workspace_id, user_id=user_id, role=role)
        self.session.add(member)
        await self.session.flush()
        return member
