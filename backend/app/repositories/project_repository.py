from __future__ import annotations

import uuid

from sqlalchemy import func, or_, select

from app.models.project import Project
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    model = Project

    async def list_by_workspace(
        self,
        workspace_id: uuid.UUID,
        *,
        include_archived: bool = False,
        status: str | None = None,
        is_favorite: bool | None = None,
        search: str | None = None,
    ) -> list[Project]:
        stmt = select(Project).where(Project.workspace_id == workspace_id)

        if not include_archived:
            stmt = stmt.where(Project.is_archived.is_(False))
        if status is not None:
            stmt = stmt.where(Project.status == status)
        if is_favorite is not None:
            stmt = stmt.where(Project.is_favorite.is_(is_favorite))
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Project.name).like(like),
                    func.lower(func.coalesce(Project.description, "")).like(like),
                )
            )

        stmt = stmt.order_by(Project.is_favorite.desc(), Project.updated_at.desc())
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_in_workspace(
        self, project_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Project | None:
        stmt = select(Project).where(
            Project.id == project_id, Project.workspace_id == workspace_id
        )
        return await self.session.scalar(stmt)
