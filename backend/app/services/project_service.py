from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.project import Project
from app.repositories.milestone_repository import MilestoneRepository
from app.repositories.project_repository import ProjectRepository
from app.repositories.tag_repository import TagRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.project import (
    MilestoneCreate,
    MilestoneRead,
    MilestoneUpdate,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)


class ProjectService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.projects = ProjectRepository(session)
        self.tags = TagRepository(session)
        self.milestones = MilestoneRepository(session)
        self.tasks = TaskRepository(session)

    # ------------------------------ mapping ----------------------------
    @staticmethod
    def to_read(project: Project) -> ProjectRead:
        milestones = list(project.milestones)
        total = len(milestones)
        done = sum(1 for m in milestones if m.completed)

        read = ProjectRead.model_validate(project)
        read.milestone_count = total
        read.completed_milestone_count = done
        read.progress = round(done / total * 100) if total else 0
        return read

    async def _get_or_404(
        self, project_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Project:
        project = await self.projects.get_in_workspace(project_id, workspace_id)
        if project is None:
            raise NotFoundError("Project not found")
        return project

    # ------------------------------ projects ----------------------------
    async def list_projects(
        self,
        workspace_id: uuid.UUID,
        *,
        include_archived: bool = False,
        status: str | None = None,
        is_favorite: bool | None = None,
        search: str | None = None,
    ) -> list[ProjectRead]:
        projects = await self.projects.list_by_workspace(
            workspace_id,
            include_archived=include_archived,
            status=status,
            is_favorite=is_favorite,
            search=search,
        )
        return [self.to_read(p) for p in projects]

    async def get(self, project_id: uuid.UUID, workspace_id: uuid.UUID) -> ProjectRead:
        project = await self._get_or_404(project_id, workspace_id)
        read = self.to_read(project)
        total, done = await self.tasks.count_for_project(project_id)
        read.task_count = total
        read.completed_task_count = done
        return read

    async def create(self, workspace_id: uuid.UUID, data: ProjectCreate) -> ProjectRead:
        tags = await self.tags.get_many(workspace_id, data.tag_ids)
        project = Project(
            workspace_id=workspace_id,
            name=data.name,
            description=data.description,
            color=data.color,
            icon=data.icon,
            status=data.status,
            deadline=data.deadline,
            repository_url=data.repository_url,
            tags=tags,
        )
        self.session.add(project)
        await self.session.flush()
        refreshed = await self._get_or_404(project.id, workspace_id)
        return self.to_read(refreshed)

    async def update(
        self,
        project_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: ProjectUpdate,
    ) -> ProjectRead:
        project = await self._get_or_404(project_id, workspace_id)
        payload = data.model_dump(exclude_unset=True)

        if "tag_ids" in payload:
            tag_ids = payload.pop("tag_ids") or []
            project.tags = await self.tags.get_many(workspace_id, tag_ids)

        for field, value in payload.items():
            setattr(project, field, value)

        await self.session.flush()
        refreshed = await self._get_or_404(project_id, workspace_id)
        return self.to_read(refreshed)

    async def delete(self, project_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
        project = await self._get_or_404(project_id, workspace_id)
        await self.session.delete(project)
        await self.session.flush()

    # ----------------------------- milestones ---------------------------
    async def list_milestones(
        self, project_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> list[MilestoneRead]:
        await self._get_or_404(project_id, workspace_id)
        milestones = await self.milestones.list_by_project(project_id)
        return [MilestoneRead.model_validate(m) for m in milestones]

    async def add_milestone(
        self,
        project_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: MilestoneCreate,
    ) -> MilestoneRead:
        await self._get_or_404(project_id, workspace_id)
        position = (
            data.position
            if data.position is not None
            else await self.milestones.next_position(project_id)
        )
        milestone = await self.milestones.create(
            project_id=project_id,
            name=data.name,
            description=data.description,
            due_date=data.due_date,
            position=position,
        )
        return MilestoneRead.model_validate(milestone)

    async def update_milestone(
        self,
        project_id: uuid.UUID,
        milestone_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: MilestoneUpdate,
    ) -> MilestoneRead:
        await self._get_or_404(project_id, workspace_id)
        milestone = await self.milestones.get(milestone_id)
        if milestone is None or milestone.project_id != project_id:
            raise NotFoundError("Milestone not found")
        payload = data.model_dump(exclude_unset=True)
        updated = await self.milestones.update(milestone, **payload)
        return MilestoneRead.model_validate(updated)

    async def delete_milestone(
        self,
        project_id: uuid.UUID,
        milestone_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> None:
        await self._get_or_404(project_id, workspace_id)
        milestone = await self.milestones.get(milestone_id)
        if milestone is None or milestone.project_id != project_id:
            raise NotFoundError("Milestone not found")
        await self.milestones.delete(milestone)
