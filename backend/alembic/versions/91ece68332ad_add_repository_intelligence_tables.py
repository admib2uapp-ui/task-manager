"""add repository intelligence tables

Revision ID: 91ece68332ad
Revises: 0007_attachments
Create Date: 2026-07-14 23:05:42.422915

"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "91ece68332ad"
down_revision: str | None = "0007_attachments"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "repository_connections",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=True),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("github_owner", sa.String(length=100), nullable=False),
        sa.Column("github_repo", sa.String(length=100), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("token_type", sa.String(length=20), nullable=False),
        sa.Column("encrypted_token", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("repository_metadata", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "repository_chats",
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("connection_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=True),
        sa.Column("context", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("model", sa.String(length=100), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["connection_id"], ["repository_connections.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repository_chats_connection_id", "repository_chats", ["connection_id"], unique=False)

    op.create_table(
        "repository_scans",
        sa.Column("connection_id", sa.Uuid(), nullable=False),
        sa.Column("scan_type", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("task_id", sa.String(length=255), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("commit_hash", sa.String(length=40), nullable=True),
        sa.Column("commit_message", sa.Text(), nullable=True),
        sa.Column("file_count", sa.Integer(), nullable=False),
        sa.Column("total_lines", sa.Integer(), nullable=False),
        sa.Column("total_size_bytes", sa.Integer(), nullable=False),
        sa.Column("language_breakdown", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["connection_id"], ["repository_connections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repository_scans_connection_id", "repository_scans", ["connection_id"], unique=False)

    op.create_table(
        "ai_repository_reports",
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("full_content", sa.Text(), nullable=True),
        sa.Column("scores", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("generated_by", sa.String(length=100), nullable=True),
        sa.Column("metadata", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["scan_id"], ["repository_scans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_ai_repository_reports_scan_id", "ai_repository_reports", ["scan_id"], unique=False)

    op.create_table(
        "code_issues",
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("line_start", sa.Integer(), nullable=True),
        sa.Column("line_end", sa.Integer(), nullable=True),
        sa.Column("issue_type", sa.String(length=100), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("suggestion", sa.Text(), nullable=True),
        sa.Column("language", sa.String(length=50), nullable=True),
        sa.Column("rule_id", sa.String(length=100), nullable=True),
        sa.Column("metadata", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("is_resolved", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["scan_id"], ["repository_scans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_code_issues_scan_id", "code_issues", ["scan_id"], unique=False)

    op.create_table(
        "repository_metrics",
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("metric_name", sa.String(length=100), nullable=False),
        sa.Column("metric_value", sa.Float(), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("dimension", sa.String(length=50), nullable=True),
        sa.Column("metadata", sa.JSON(none_as_null=True), nullable=True),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["scan_id"], ["repository_scans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repository_metrics_scan_id", "repository_metrics", ["scan_id"], unique=False)

    op.create_table(
        "repository_scores",
        sa.Column("scan_id", sa.Uuid(), nullable=False),
        sa.Column("workspace_id", sa.Uuid(), nullable=False),
        sa.Column("overall", sa.Float(), nullable=False),
        sa.Column("architecture", sa.Float(), nullable=False),
        sa.Column("code_quality", sa.Float(), nullable=False),
        sa.Column("security", sa.Float(), nullable=False),
        sa.Column("performance", sa.Float(), nullable=False),
        sa.Column("testing", sa.Float(), nullable=False),
        sa.Column("documentation", sa.Float(), nullable=False),
        sa.Column("maintainability", sa.Float(), nullable=False),
        sa.Column("technical_debt", sa.Float(), nullable=False),
        sa.Column("complexity", sa.Float(), nullable=False),
        sa.Column("dx_score", sa.Float(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("(CURRENT_TIMESTAMP)"), nullable=False),
        sa.ForeignKeyConstraint(["scan_id"], ["repository_scans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_repository_scores_scan_id", "repository_scores", ["scan_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_repository_scores_scan_id", table_name="repository_scores")
    op.drop_table("repository_scores")

    op.drop_index("ix_repository_metrics_scan_id", table_name="repository_metrics")
    op.drop_table("repository_metrics")

    op.drop_index("ix_code_issues_scan_id", table_name="code_issues")
    op.drop_table("code_issues")

    op.drop_index("ix_ai_repository_reports_scan_id", table_name="ai_repository_reports")
    op.drop_table("ai_repository_reports")

    op.drop_index("ix_repository_scans_connection_id", table_name="repository_scans")
    op.drop_table("repository_scans")

    op.drop_index("ix_repository_chats_connection_id", table_name="repository_chats")
    op.drop_table("repository_chats")

    op.drop_table("repository_connections")
