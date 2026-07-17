from __future__ import annotations

from sqlalchemy import Column, ForeignKey, Table, Uuid

from app.models.base import Base

# Many-to-many association between projects and tags.
project_tags = Table(
    "project_tags",
    Base.metadata,
    Column(
        "project_id",
        Uuid,
        ForeignKey("projects.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

# Many-to-many association between tasks and tags.
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column(
        "task_id",
        Uuid,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

from sqlalchemy import CheckConstraint

# Self-referential task dependencies (task depends_on another task).
task_dependencies = Table(
    "task_dependencies",
    Base.metadata,
    Column(
        "task_id",
        Uuid,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "depends_on_id",
        Uuid,
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    CheckConstraint("task_id != depends_on_id", name="ck_no_self_dependency"),
)
