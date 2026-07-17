from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.associations import task_dependencies, task_tags
from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.attachment import Attachment
    from app.models.comment import Comment
    from app.models.project import Project
    from app.models.tag import Tag
    from app.models.task_items import ChecklistItem, Subtask
    from app.models.user import User


class Task(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "tasks"

    project_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="backlog", nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    position: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estimated_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # GitHub integration
    github_repo_url: Mapped[str | None] = mapped_column(String(1024))
    github_issue_url: Mapped[str | None] = mapped_column(String(1024))
    github_pr_url: Mapped[str | None] = mapped_column(String(1024))
    github_branch: Mapped[str | None] = mapped_column(String(255))

    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    project: Mapped[Project] = relationship(back_populates="tasks", lazy="selectin")
    assignee: Mapped[User | None] = relationship(lazy="selectin")
    tags: Mapped[list[Tag]] = relationship(secondary=task_tags, lazy="selectin")
    subtasks: Mapped[list[Subtask]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Subtask.position",
    )
    checklist_items: Mapped[list[ChecklistItem]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="ChecklistItem.position",
    )
    attachments: Mapped[list[Attachment]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Attachment.created_at",
    )
    comments: Mapped[list[Comment]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Comment.created_at",
    )
    dependencies: Mapped[list[Task]] = relationship(
        secondary=task_dependencies,
        primaryjoin="Task.id == task_dependencies.c.task_id",
        secondaryjoin="Task.id == task_dependencies.c.depends_on_id",
    )

    @property
    def checklist(self) -> list[ChecklistItem]:
        """Alias used by API schemas (maps to checklist_items)."""
        return self.checklist_items
