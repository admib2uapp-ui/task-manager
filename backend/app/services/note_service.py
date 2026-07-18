from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.core.permissions import check_owner_or_admin
from app.models.note import Note
from app.repositories.base import BaseRepository
from app.schemas.note import (
    NoteCreate,
    NoteRead,
    NoteSummary,
    NoteUpdate,
)
from app.services.audit_service import AuditService


class NoteRepository(BaseRepository[Note]):
    model = Note

    async def list_by_workspace(self, workspace_id: uuid.UUID) -> list[Note]:
        stmt = (
            select(Note)
            .where(Note.workspace_id == workspace_id)
            .order_by(Note.updated_at.desc())
        )
        result = await self.session.scalars(stmt)
        return list(result.all())

    async def get_in_workspace(
        self, note_id: uuid.UUID, workspace_id: uuid.UUID
    ) -> Note | None:
        stmt = select(Note).where(Note.id == note_id, Note.workspace_id == workspace_id)
        return await self.session.scalar(stmt)


class NoteService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.notes = NoteRepository(session)

    async def _get_or_404(self, note_id: uuid.UUID, workspace_id: uuid.UUID) -> Note:
        note = await self.notes.get_in_workspace(note_id, workspace_id)
        if note is None:
            raise NotFoundError("Note not found")
        return note

    async def list_notes(self, workspace_id: uuid.UUID) -> list[NoteSummary]:
        notes = await self.notes.list_by_workspace(workspace_id)
        return [NoteSummary.model_validate(n) for n in notes]

    async def get(self, note_id: uuid.UUID, workspace_id: uuid.UUID) -> NoteRead:
        return NoteRead.model_validate(await self._get_or_404(note_id, workspace_id))

    async def create(
        self, workspace_id: uuid.UUID, data: NoteCreate, *, current_user_id: uuid.UUID
    ) -> NoteRead:
        note = await self.notes.create(
            workspace_id=workspace_id,
            title=data.title,
            content=data.content,
            project_id=data.project_id,
            created_by=current_user_id,
        )
        await AuditService(self.session).log(
            user_id=current_user_id,
            action="CREATE_NOTE",
            entity_type="Note",
            entity_id=note.id,
        )
        return NoteRead.model_validate(note)

    async def update(
        self,
        note_id: uuid.UUID,
        workspace_id: uuid.UUID,
        data: NoteUpdate,
        *,
        current_user_id: uuid.UUID,
        member_role: str | None = None,
    ) -> NoteRead:
        note = await self._get_or_404(note_id, workspace_id)
        check_owner_or_admin(note, current_user_id, member_role, label="note")
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(note, field, value)
        note.updated_by = current_user_id
        await self.session.flush()
        await AuditService(self.session).log(
            user_id=current_user_id,
            action="UPDATE_NOTE",
            entity_type="Note",
            entity_id=note_id,
            details={"changes": list(data.model_dump(exclude_unset=True).keys())},
        )
        refreshed = await self._get_or_404(note_id, workspace_id)
        return NoteRead.model_validate(refreshed)

    async def delete(
        self, note_id: uuid.UUID, workspace_id: uuid.UUID,
        *, current_user_id: uuid.UUID,
        member_role: str | None = None,
    ) -> None:
        note = await self._get_or_404(note_id, workspace_id)
        check_owner_or_admin(note, current_user_id, member_role, label="note")
        await AuditService(self.session).log(
            user_id=current_user_id,
            action="DELETE_NOTE",
            entity_type="Note",
            entity_id=note_id,
        )
        await self.session.delete(note)
        await self.session.flush()
