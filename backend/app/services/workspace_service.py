from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import DEFAULT_TAGS
from app.models.tag import Tag
from app.models.user import User
from app.models.workspace import Workspace
from app.repositories.workspace_repository import WorkspaceRepository

COMPANY_SLUG = "company"
COMPANY_NAME = "Company"


class WorkspaceService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.workspaces = WorkspaceRepository(session)

    async def _get_company_workspace(self) -> Workspace | None:
        """Find the shared Company workspace by slug."""
        stmt = select(Workspace).where(Workspace.slug == COMPANY_SLUG)
        return await self.session.scalar(stmt)

    async def join_company(self, user: User) -> Workspace:
        """Find or create the shared Company workspace, adding the user."""
        workspace = await self._get_company_workspace()
        if workspace is None:
            workspace = await self.workspaces.create(
                name=COMPANY_NAME,
                slug=COMPANY_SLUG,
                owner_id=user.id,
            )
            for name, color in DEFAULT_TAGS:
                self.session.add(Tag(workspace_id=workspace.id, name=name, color=color))
            await self.workspaces.add_member(
                workspace_id=workspace.id, user_id=user.id, role="owner"
            )
            await self.session.flush()
            return workspace

        existing = await self.workspaces.list_for_user(user.id)
        if not any(w.id == workspace.id for w in existing):
            await self.workspaces.add_member(
                workspace_id=workspace.id, user_id=user.id, role="member"
            )
        return workspace

    async def get_default(self, user: User) -> Workspace:
        """Return the shared Company workspace (always the default)."""
        return await self.join_company(user)
