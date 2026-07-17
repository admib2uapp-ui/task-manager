"""add github_token and github_login to users

Revision ID: 0008_github_user_tokens
Revises: 91ece68332ad
Create Date: 2026-07-16

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_github_user_tokens"
down_revision: str | None = "91ece68332ad"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("github_token", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("github_login", sa.String(length=100), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "github_login")
    op.drop_column("users", "github_token")
