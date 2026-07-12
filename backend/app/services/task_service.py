from __future__ import annotations

import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BadRequestError, NotFoundError
from app.models.attachment import Attachment
from app.models.task import Task
from app.models.task_items import ChecklistItem, Subtask
from app.repositories.project_repository import ProjectRepository
from app.repositories.tag_repository import TagRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import (
    ChecklistItemCreate,
    ChecklistItemUpdate,
    CommentCreate,
    CommentRead,
    SubtaskCreate,
    SubtaskUpdate,
    TaskCreate,
    TaskDetail,
    TaskMove,
    TaskRead,
    TaskUpdate,
)


class TaskService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.tasks = TaskRepository(session)
        self.projects = ProjectRepository(session)
        self.tags = TagRepository(session)

    # ------------------------------ mapping ----------------------------
    @staticmethod
    def to_read(task: Task) -> TaskRead:
        return TaskRead.model_validate(task)

    @staticmethod
    def to_detail(task: Task) -> TaskDetail:
        detail = TaskDetail.model_validate(task)
        detail.dependency_ids = [dep.id for dep in task.dependencies]
        return detail

    # ------------------------------ helpers -----------------------------
    async def _task_or_404(self, task_id: uuid.UUID, workspace_id: uuid.UUID) -> Task:
        task = await self.tasks.get_in_workspace(task_id, workspace_id)
        if task is None:
            raise NotFoundError("Task not found")
        return task

    async def _detail_or_404(self, task_id: uuid.UUID, workspace_id: uuid.UUID) -> Task:
        task = await self.tasks.get_detail_in_workspace(task_id, workspace_id)
        if task is None:
            raise NotFoundError("Task not found")
        return task

    # ------------------------------- tasks ------------------------------
    async def list_tasks(
        self,
        workspace_id: uuid.UUID,
        *,
        project_id: uuid.UUID | None = None,
        status: str | None = None,
        priority: str | None = None,
        assignee_id: uuid.UUID | None = None,
        tag_id: uuid.UUID | None = None,
        search: str | None = None,
    ) -> list[TaskRead]:
        tasks = await self.tasks.list_for_workspace(
            workspace_id,
            project_id=project_id,
            status=status,
            priority=priority,
            assignee_id=assignee_id,
            tag_id=tag_id,
            search=search,
        )
        return [self.to_read(t) for t in tasks]

    async def get_detail(
        self, task_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> TaskDetail:
        task = await self._detail_or_404(task_id, workspace_id)
        return self.to_detail(task)

    async def create(self, workspace_id: uuid.UUID, data: TaskCreate) -> TaskDetail:
        project = await self.projects.get_in_workspace(data.project_id, workspace_id)
        if project is None:
            raise BadRequestError("Project not found in workspace")

        tags = await self.tags.get_many(workspace_id, data.tag_ids)
        position = await self.tasks.next_position(data.project_id, data.status)

        task = Task(
            project_id=data.project_id,
            title=data.title,
            description=data.description,
            status=data.status,
            priority=data.priority,
            position=position,
            assignee_id=data.assignee_id,
            deadline=data.deadline,
            estimated_hours=data.estimated_hours,
            github_repo_url=data.github_repo_url,
            github_issue_url=data.github_issue_url,
            github_pr_url=data.github_pr_url,
            github_branch=data.github_branch,
            tags=tags,
        )
        self.session.add(task)
        await self.session.flush()
        return await self.get_detail(task.id, workspace_id)

    async def update(
        self,
        task_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: TaskUpdate,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        payload = data.model_dump(exclude_unset=True)

        if "tag_ids" in payload:
            tag_ids = payload.pop("tag_ids") or []
            task.tags = await self.tags.get_many(workspace_id, tag_ids)

        for field, value in payload.items():
            setattr(task, field, value)

        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def move(
        self, task_id: uuid.UUID, workspace_id: uuid.UUID, data: TaskMove
    ) -> TaskRead:
        task = await self._task_or_404(task_id, workspace_id)
        task.status = data.status
        task.position = data.position
        await self.session.flush()
        refreshed = await self._task_or_404(task_id, workspace_id)
        return self.to_read(refreshed)

    async def delete(self, task_id: uuid.UUID, workspace_id: uuid.UUID) -> None:
        task = await self._task_or_404(task_id, workspace_id)
        await self.session.delete(task)
        await self.session.flush()

    # ------------------------------ subtasks ----------------------------
    async def add_subtask(
        self, task_id: uuid.UUID, workspace_id: uuid.UUID, data: SubtaskCreate
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        position = (len(task.subtasks) + 1) * 1024.0
        task.subtasks.append(
            Subtask(task_id=task.id, title=data.title, position=position)
        )
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def update_subtask(
        self,
        task_id: uuid.UUID,
        subtask_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: SubtaskUpdate,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        subtask = next((s for s in task.subtasks if s.id == subtask_id), None)
        if subtask is None:
            raise NotFoundError("Subtask not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(subtask, field, value)
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def delete_subtask(
        self,
        task_id: uuid.UUID,
        subtask_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        subtask = next((s for s in task.subtasks if s.id == subtask_id), None)
        if subtask is None:
            raise NotFoundError("Subtask not found")
        task.subtasks.remove(subtask)
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    # ---------------------------- checklist -----------------------------
    async def add_checklist_item(
        self,
        task_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: ChecklistItemCreate,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        position = (len(task.checklist_items) + 1) * 1024.0
        task.checklist_items.append(
            ChecklistItem(task_id=task.id, content=data.content, position=position)
        )
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def update_checklist_item(
        self,
        task_id: uuid.UUID,
        item_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: ChecklistItemUpdate,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        item = next((c for c in task.checklist_items if c.id == item_id), None)
        if item is None:
            raise NotFoundError("Checklist item not found")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(item, field, value)
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def delete_checklist_item(
        self,
        task_id: uuid.UUID,
        item_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        item = next((c for c in task.checklist_items if c.id == item_id), None)
        if item is None:
            raise NotFoundError("Checklist item not found")
        task.checklist_items.remove(item)
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    # ----------------------------- comments -----------------------------
    async def add_comment(
        self,
        task_id: uuid.UUID,
        workspace_id: uuid.UUID,
        author_id: uuid.UUID,
        data: CommentCreate,
    ) -> CommentRead:
        from app.models.comment import Comment

        task = await self._task_or_404(task_id, workspace_id)
        comment = Comment(task_id=task_id, author_id=author_id, body=data.body)
        self.session.add(comment)
        await self.session.flush()
        await self.session.refresh(comment, attribute_names=["author"])

        if task.assignee_id and task.assignee_id != author_id:
            from app.services.notification_service import NotificationService

            await NotificationService(self.session).create(
                user_id=task.assignee_id,
                type_="comment",
                title="New comment",
                body=f"on “{task.title}”",
                entity_type="task",
                entity_id=task.id,
            )

        return CommentRead.model_validate(comment)

    async def delete_comment(
        self,
        task_id: uuid.UUID,
        comment_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> None:
        task = await self._detail_or_404(task_id, workspace_id)
        comment = next((c for c in task.comments if c.id == comment_id), None)
        if comment is None:
            raise NotFoundError("Comment not found")
        await self.session.delete(comment)
        await self.session.flush()

    # --------------------------- dependencies ---------------------------
    async def add_dependency(
        self,
        task_id: uuid.UUID,
        workspace_id: uuid.UUID,
        depends_on_id: uuid.UUID,
    ) -> TaskDetail:
        if task_id == depends_on_id:
            raise BadRequestError("A task cannot depend on itself")
        task = await self._detail_or_404(task_id, workspace_id)
        dependency = await self._task_or_404(depends_on_id, workspace_id)
        if dependency.id not in {d.id for d in task.dependencies}:
            task.dependencies.append(dependency)
            await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def remove_dependency(
        self,
        task_id: uuid.UUID,
        depends_on_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> TaskDetail:
        task = await self._detail_or_404(task_id, workspace_id)
        task.dependencies = [d for d in task.dependencies if d.id != depends_on_id]
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    # --------------------------- attachments ----------------------------
    async def add_attachment(
        self,
        task_id: uuid.UUID,
        workspace_id: uuid.UUID,
        *,
        file_name: str,
        content: bytes,
        content_type: str,
    ) -> TaskDetail:
        if len(content) > settings.MAX_UPLOAD_BYTES:
            raise BadRequestError("File exceeds the maximum allowed size")

        task = await self._task_or_404(task_id, workspace_id)
        suffix = Path(file_name).suffix[:20]
        stored_name = f"{uuid.uuid4().hex}{suffix}"
        upload_dir = Path(settings.UPLOAD_DIR)
        upload_dir.mkdir(parents=True, exist_ok=True)
        (upload_dir / stored_name).write_bytes(content)

        task.attachments.append(
            Attachment(
                task_id=task.id,
                file_name=file_name[:255],
                stored_name=stored_name,
                file_url=f"/uploads/{stored_name}",
                mime_type=(content_type or "application/octet-stream")[:120],
                size_bytes=len(content),
            )
        )
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)

    async def delete_attachment(
        self,
        task_id: uuid.UUID,
        attachment_id: uuid.UUID,
        workspace_id: uuid.UUID,
    ) -> TaskDetail:
        task = await self._task_or_404(task_id, workspace_id)
        attachment = next((a for a in task.attachments if a.id == attachment_id), None)
        if attachment is None:
            raise NotFoundError("Attachment not found")
        stored = Path(settings.UPLOAD_DIR) / attachment.stored_name
        stored.unlink(missing_ok=True)
        task.attachments.remove(attachment)
        await self.session.flush()
        return await self.get_detail(task_id, workspace_id)
