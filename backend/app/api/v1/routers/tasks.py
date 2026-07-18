from __future__ import annotations

import uuid

from fastapi import APIRouter, File, Query, UploadFile, status

from app.core.deps import CurrentUser, CurrentUserRole, CurrentWorkspace, DbSession
from app.core.ws_manager import publish_invalidate
from app.schemas.common import MessageResponse
from app.schemas.task import (
    ChecklistItemCreate,
    ChecklistItemUpdate,
    CommentCreate,
    CommentRead,
    DependencyCreate,
    SubtaskCreate,
    SubtaskUpdate,
    TaskCreate,
    TaskDetail,
    TaskMove,
    TaskRead,
    TaskUpdate,
)
from app.services.task_service import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskRead])
async def list_tasks(
    workspace: CurrentWorkspace,
    db: DbSession,
    project_id: uuid.UUID | None = Query(None, alias="projectId"),
    status_filter: str | None = Query(None, alias="status"),
    priority: str | None = Query(None),
    assignee_id: uuid.UUID | None = Query(None, alias="assigneeId"),
    tag_id: uuid.UUID | None = Query(None, alias="tagId"),
    search: str | None = Query(None),
) -> list[TaskRead]:
    service = TaskService(db)
    return await service.list_tasks(
        workspace.id,
        project_id=project_id,
        status=status_filter,
        priority=priority,
        assignee_id=assignee_id,
        tag_id=tag_id,
        search=search,
    )


@router.post("", response_model=TaskDetail, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.create(workspace.id, payload, current_user_id=uid)
    await publish_invalidate(workspace.id)
    return result


@router.get("/{task_id}", response_model=TaskDetail)
async def get_task(
    task_id: uuid.UUID, workspace: CurrentWorkspace, db: DbSession
) -> TaskDetail:
    service = TaskService(db)
    return await service.get_detail(task_id, workspace.id)


@router.patch("/{task_id}", response_model=TaskDetail)
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.update(
        task_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.post("/{task_id}/move", response_model=TaskRead)
async def move_task(
    task_id: uuid.UUID,
    payload: TaskMove,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskRead:
    service = TaskService(db)
    uid = current_user.id
    result = await service.move(
        task_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.delete("/{task_id}", response_model=MessageResponse)
async def delete_task(
    task_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> MessageResponse:
    service = TaskService(db)
    await service.delete(
        task_id, workspace.id, current_user_id=current_user.id,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return MessageResponse(message="Task deleted")


# ------------------------------- subtasks ----------------------------------
@router.post(
    "/{task_id}/subtasks",
    response_model=TaskDetail,
    status_code=status.HTTP_201_CREATED,
)
async def add_subtask(
    task_id: uuid.UUID,
    payload: SubtaskCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.add_subtask(
        task_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.patch("/{task_id}/subtasks/{subtask_id}", response_model=TaskDetail)
async def update_subtask(
    task_id: uuid.UUID,
    subtask_id: uuid.UUID,
    payload: SubtaskUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.update_subtask(
        task_id, subtask_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.delete("/{task_id}/subtasks/{subtask_id}", response_model=TaskDetail)
async def delete_subtask(
    task_id: uuid.UUID,
    subtask_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.delete_subtask(
        task_id, subtask_id, workspace.id, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


# ------------------------------ checklist ----------------------------------
@router.post(
    "/{task_id}/checklist",
    response_model=TaskDetail,
    status_code=status.HTTP_201_CREATED,
)
async def add_checklist_item(
    task_id: uuid.UUID,
    payload: ChecklistItemCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.add_checklist_item(
        task_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.patch("/{task_id}/checklist/{item_id}", response_model=TaskDetail)
async def update_checklist_item(
    task_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: ChecklistItemUpdate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.update_checklist_item(
        task_id, item_id, workspace.id, payload, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.delete("/{task_id}/checklist/{item_id}", response_model=TaskDetail)
async def delete_checklist_item(
    task_id: uuid.UUID,
    item_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.delete_checklist_item(
        task_id, item_id, workspace.id, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


# ------------------------------- comments ----------------------------------
@router.post(
    "/{task_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    task_id: uuid.UUID,
    payload: CommentCreate,
    workspace: CurrentWorkspace,
    current_user: CurrentUser,
    db: DbSession,
) -> CommentRead:
    service = TaskService(db)
    result = await service.add_comment(task_id, workspace.id, current_user.id, payload)
    await publish_invalidate(workspace.id)
    return result


@router.delete("/{task_id}/comments/{comment_id}", response_model=MessageResponse)
async def delete_comment(
    task_id: uuid.UUID,
    comment_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> MessageResponse:
    service = TaskService(db)
    uid = current_user.id
    await service.delete_comment(
        task_id, comment_id, workspace.id, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return MessageResponse(message="Comment deleted")


# ----------------------------- dependencies --------------------------------
@router.post(
    "/{task_id}/dependencies",
    response_model=TaskDetail,
    status_code=status.HTTP_201_CREATED,
)
async def add_dependency(
    task_id: uuid.UUID,
    payload: DependencyCreate,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.add_dependency(
        task_id, workspace.id, payload.depends_on_id, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.delete("/{task_id}/dependencies/{depends_on_id}", response_model=TaskDetail)
async def remove_dependency(
    task_id: uuid.UUID,
    depends_on_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.remove_dependency(
        task_id, depends_on_id, workspace.id, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


# ----------------------------- attachments ---------------------------------
@router.post(
    "/{task_id}/attachments",
    response_model=TaskDetail,
    status_code=status.HTTP_201_CREATED,
)
async def add_attachment(
    task_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
    file: UploadFile = File(...),
) -> TaskDetail:
    service = TaskService(db)
    content = await file.read()
    result = await service.add_attachment(
        task_id,
        workspace.id,
        file_name=file.filename or "file",
        content=content,
        content_type=file.content_type or "application/octet-stream",
        current_user_id=current_user.id,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result


@router.delete("/{task_id}/attachments/{attachment_id}", response_model=TaskDetail)
async def delete_attachment(
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    workspace: CurrentWorkspace,
    db: DbSession,
    current_user: CurrentUser,
    current_member: CurrentUserRole,
) -> TaskDetail:
    service = TaskService(db)
    uid = current_user.id
    result = await service.delete_attachment(
        task_id, attachment_id, workspace.id, current_user_id=uid,
        member_role=current_member.role,
    )
    await publish_invalidate(workspace.id)
    return result
