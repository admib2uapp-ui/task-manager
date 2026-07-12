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
