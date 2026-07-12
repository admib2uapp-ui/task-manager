"""tasks, subtasks, checklist_items, comments, task_tags, task_dependencies

Revision ID: 0003_tasks
Revises: 0002_projects
Create Date: 2026-07-12

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_tasks"
down_revision: str | None = "0002_projects"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            server_default=sa.text("'backlog'"),
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.String(length=20),
            server_default=sa.text("'medium'"),
            nullable=False,
        ),
        sa.Column(
            "position", sa.Float(), server_default=sa.text("0"), nullable=False
        ),
        sa.Column("assignee_id", sa.Uuid(), nullable=True),
        sa.Column("deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("estimated_hours", sa.Float(), nullable=True),
        sa.Column(
            "time_spent_seconds",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        sa.Column("github_repo_url", sa.String(length=1024), nullable=True),
        sa.Column("github_issue_url", sa.String(length=1024), nullable=True),
        sa.Column("github_pr_url", sa.String(length=1024), nullable=True),
        sa.Column("github_branch", sa.String(length=255), nullable=True),
        sa.Column(
            "is_pinned",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["project_id"], ["projects.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["assignee_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_project_id", "tasks", ["project_id"])
    op.create_index("ix_tasks_status", "tasks", ["status"])

    op.create_table(
        "subtasks",
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column(
            "completed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "position", sa.Float(), server_default=sa.text("0"), nullable=False
        ),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_subtasks_task_id", "subtasks", ["task_id"])

    op.create_table(
        "checklist_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("content", sa.String(length=500), nullable=False),
        sa.Column(
            "completed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "position", sa.Float(), server_default=sa.text("0"), nullable=False
        ),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_checklist_items_task_id", "checklist_items", ["task_id"]
    )

    op.create_table(
        "comments",
        sa.Column("id", sa.Uuid(), nullable=False),
        *_timestamps(),
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("author_id", sa.Uuid(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["author_id"], ["users.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_task_id", "comments", ["task_id"])

    op.create_table(
        "task_tags",
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("tag_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("task_id", "tag_id"),
    )

    op.create_table(
        "task_dependencies",
        sa.Column("task_id", sa.Uuid(), nullable=False),
        sa.Column("depends_on_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["depends_on_id"], ["tasks.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("task_id", "depends_on_id"),
    )


def downgrade() -> None:
    op.drop_table("task_dependencies")
    op.drop_table("task_tags")
    op.drop_index("ix_comments_task_id", table_name="comments")
    op.drop_table("comments")
    op.drop_index("ix_checklist_items_task_id", table_name="checklist_items")
    op.drop_table("checklist_items")
    op.drop_index("ix_subtasks_task_id", table_name="subtasks")
    op.drop_table("subtasks")
    op.drop_index("ix_tasks_status", table_name="tasks")
    op.drop_index("ix_tasks_project_id", table_name="tasks")
    op.drop_table("tasks")
