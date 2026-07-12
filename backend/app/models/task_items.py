from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.task import Task


class Subtask(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "subtasks"

    task_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    task: Mapped[Task] = relationship(back_populates="subtasks")


class ChecklistItem(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "checklist_items"

    task_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    position: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    task: Mapped[Task] = relationship(back_populates="checklist_items")
