from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import User
    from app.models.workspace import Workspace


class RepositoryConnection(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "repository_connections"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    github_owner: Mapped[str] = mapped_column(String(100), nullable=False)
    github_repo: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(
        String(20), default="github", nullable=False
    )
    token_type: Mapped[str] = mapped_column(
        String(20), default="oauth", nullable=False
    )
    encrypted_token: Mapped[str] = mapped_column(Text, nullable=False)

    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    last_synced_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    repo_info: Mapped[dict[str, Any] | None] = mapped_column(
        "repository_metadata", JSON(none_as_null=True), nullable=True
    )

    scans: Mapped[list[RepositoryScan]] = relationship(
        back_populates="connection",
        cascade="all, delete-orphan",
        order_by="RepositoryScan.started_at.desc()",
    )


class RepositoryScan(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "repository_scans"

    connection_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("repository_connections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scan_type: Mapped[str] = mapped_column(
        String(20), default="full", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    commit_hash: Mapped[str | None] = mapped_column(String(40), nullable=True)
    commit_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    file_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_lines: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    language_breakdown: Mapped[dict[str, Any] | None] = mapped_column(
        JSON(none_as_null=True), nullable=True
    )

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    connection: Mapped[RepositoryConnection] = relationship(back_populates="scans")
    issues: Mapped[list[CodeIssue]] = relationship(
        back_populates="scan",
        cascade="all, delete-orphan",
    )
    metrics: Mapped[list[RepositoryMetric]] = relationship(
        back_populates="scan",
        cascade="all, delete-orphan",
    )
    score: Mapped[RepositoryScore | None] = relationship(
        back_populates="scan",
        cascade="all, delete-orphan",
        uselist=False,
    )
    reports: Mapped[list[AIRepositoryReport]] = relationship(
        back_populates="scan",
        cascade="all, delete-orphan",
    )


class CodeIssue(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "code_issues"

    scan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("repository_scans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    line_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    line_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    issue_type: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggestion: Mapped[str | None] = mapped_column(Text, nullable=True)
    language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    rule_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata", JSON(none_as_null=True), nullable=True
    )
    is_resolved: Mapped[bool] = mapped_column(default=False, nullable=False)

    scan: Mapped[RepositoryScan] = relationship(back_populates="issues")


class RepositoryMetric(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "repository_metrics"

    scan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("repository_scans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    dimension: Mapped[str | None] = mapped_column(String(50), nullable=True)
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata", JSON(none_as_null=True), nullable=True
    )

    scan: Mapped[RepositoryScan] = relationship(back_populates="metrics")


class AIRepositoryReport(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "ai_repository_reports"

    scan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("repository_scans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    report_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    full_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    scores: Mapped[dict[str, Any] | None] = mapped_column(JSON(none_as_null=True), nullable=True)
    generated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    extra_data: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata", JSON(none_as_null=True), nullable=True
    )

    scan: Mapped[RepositoryScan] = relationship(back_populates="reports")


class RepositoryScore(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "repository_scores"

    scan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("repository_scans.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    overall: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    architecture: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    code_quality: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    security: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    performance: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    testing: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    documentation: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    maintainability: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    technical_debt: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    complexity: Mapped[float] = mapped_column(Float, default=0, nullable=False)
    dx_score: Mapped[float] = mapped_column(Float, default=0, nullable=False)

    scan: Mapped[RepositoryScan] = relationship(back_populates="score")


class RepositoryChat(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "repository_chats"

    workspace_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False
    )
    connection_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("repository_connections.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    context: Mapped[dict[str, Any] | None] = mapped_column(
        JSON(none_as_null=True), nullable=True
    )
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
