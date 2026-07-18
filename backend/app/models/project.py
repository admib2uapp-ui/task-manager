from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.associations import project_tags
from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.milestone import Milestone
    from app.models.tag import Tag
    from app.models.task import Task
    from app.models.user import User
    from app.models.workspace import Workspace


class Project(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "projects"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str] = mapped_column(String(9), default="#3b82f6", nullable=False)
    icon: Mapped[str] = mapped_column(String(40), default="folder", nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    repository_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    workspace: Mapped[Workspace] = relationship(back_populates="projects")
    creator: Mapped[User | None] = relationship(
        lazy="selectin", foreign_keys=[created_by]
    )
    updater: Mapped[User | None] = relationship(
        lazy="selectin", foreign_keys=[updated_by]
    )
    tags: Mapped[list[Tag]] = relationship(
        secondary=project_tags,
        lazy="selectin",
    )
    milestones: Mapped[list[Milestone]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="Milestone.position",
    )
    tasks: Mapped[list[Task]] = relationship(
        back_populates="project",
        lazy="selectin",
    )
