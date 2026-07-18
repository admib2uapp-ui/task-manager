from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, status

from app.core.deps import CurrentUser, CurrentUserRole, CurrentWorkspace, DbSession
from app.schemas.common import MessageResponse
from app.schemas.project import (
    MilestoneCreate,
    MilestoneRead,
    MilestoneUpdate,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    workspace: CurrentWorkspace,
    db: DbSession,
    include_archived: bool = Query(False, alias="includeArchived"),
    status_filter: str | None = Query(None, alias="status"),
    is_favorite: bool | None = Query(None, alias="favorite"),
    search: str | None = Query(None),
) -> list[ProjectRead]:
    service = ProjectService(db)
    return await service.list_projects(
        workspace.id,
        include_archived=include_archived,
        status=status_filter,
        is_favorite=is_favorite,
        search=search,
    )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
) -> ProjectRead:
    service = ProjectService(db)
    return await service.create(workspace.id, payload, current_user_id=current_user.id)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: uuid.UUID, workspace: CurrentWorkspace, db: DbSession
) -> ProjectRead:
    service = ProjectService(db)
    return await service.get(project_id, workspace.id)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> ProjectRead:
    service = ProjectService(db)
    uid = current_user.id
    return await service.update(
        project_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )


@router.delete(
    "/{project_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_project(
    project_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> MessageResponse:
    service = ProjectService(db)
    await service.delete(
        project_id, workspace.id, current_user_id=current_user.id,
        member_role=current_member.role,
    )
    return MessageResponse(message="Project deleted")


# ------------------------------ milestones ---------------------------------
@router.get("/{project_id}/milestones", response_model=list[MilestoneRead])
async def list_milestones(
    project_id: uuid.UUID, workspace: CurrentWorkspace, db: DbSession
) -> list[MilestoneRead]:
    service = ProjectService(db)
    return await service.list_milestones(project_id, workspace.id)


@router.post(
    "/{project_id}/milestones",
    response_model=MilestoneRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_milestone(
    project_id: uuid.UUID,
    payload: MilestoneCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> MilestoneRead:
    service = ProjectService(db)
    return await service.add_milestone(project_id, workspace.id, payload)


@router.patch("/{project_id}/milestones/{milestone_id}", response_model=MilestoneRead)
async def update_milestone(
    project_id: uuid.UUID,
    milestone_id: uuid.UUID,
    payload: MilestoneUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> MilestoneRead:
    service = ProjectService(db)
    return await service.update_milestone(
        project_id, milestone_id, workspace.id, payload
    )


@router.delete(
    "/{project_id}/milestones/{milestone_id}",
    response_model=MessageResponse,
)
async def delete_milestone(
    project_id: uuid.UUID,
    milestone_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
) -> MessageResponse:
    service = ProjectService(db)
    await service.delete_milestone(project_id, milestone_id, workspace.id)
    return MessageResponse(message="Milestone deleted")
