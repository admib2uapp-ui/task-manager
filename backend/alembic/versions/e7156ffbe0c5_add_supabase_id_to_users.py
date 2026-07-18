"""add supabase_id to users

Revision ID: e7156ffbe0c5
Revises: 0008_github_user_tokens
Create Date: 2026-07-18 01:04:33.841008

"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = 'e7156ffbe0c5'
down_revision: str | None = '0008_github_user_tokens'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('supabase_id', sa.String(length=255), nullable=True))
        batch_op.create_unique_constraint('uq_users_supabase_id', ['supabase_id'])


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('uq_users_supabase_id', type_='unique')
        batch_op.drop_column('supabase_id')
