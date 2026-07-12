from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.project_repository import ProjectRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.search import SearchProject, SearchResponse, SearchTask


class SearchService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.projects = ProjectRepository(session)
        self.tasks = TaskRepository(session)

    async def search(
        self, workspace_id: uuid.UUID, query: str, *, limit: int = 5
    ) -> SearchResponse:
        query = query.strip()
        if not query:
            return SearchResponse(projects=[], tasks=[])

        projects = await self.projects.list_by_workspace(
            workspace_id, search=query, include_archived=True
        )
        tasks = await self.tasks.list_for_workspace(workspace_id, search=query)

        return SearchResponse(
            projects=[
                SearchProject(id=p.id, name=p.name, color=p.color, icon=p.icon)
                for p in projects[:limit]
            ],
            tasks=[
                SearchTask(
                    id=t.id,
                    title=t.title,
                    project_id=t.project_id,
                    project_name=t.project.name if t.project else "",
                    project_color=t.project.color if t.project else "#3b82f6",
                    status=t.status,
                    priority=t.priority,
                )
                for t in tasks[:limit]
            ],
        )
