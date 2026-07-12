from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import DEFAULT_TAGS
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.workspace_repository import WorkspaceRepository
from app.utils.slug import unique_slug


class WorkspaceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.workspaces = WorkspaceRepository(session)

    async def create_for_user(self, user: User) -> Workspace:
        """Provision a workspace with owner membership and seeded tags."""
        workspace = await self.workspaces.create(
            name=f"{user.name}'s Workspace",
            slug=unique_slug(user.name),
            owner_id=user.id,
        )
        await self.workspaces.add_member(
            workspace_id=workspace.id, user_id=user.id, role="owner"
        )
        for name, color in DEFAULT_TAGS:
            self.session.add(Tag(workspace_id=workspace.id, name=name, color=color))
        await self.session.flush()
        return workspace

    async def get_default(self, user: User) -> Workspace:
        """Return the user's primary workspace, provisioning one if absent."""
        existing = await self.workspaces.list_for_user(user.id)
        if existing:
            return existing[0]
        return await self.create_for_user(user)
