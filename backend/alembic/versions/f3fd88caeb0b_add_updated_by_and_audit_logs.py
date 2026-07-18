"""add_updated_by_and_audit_logs

Revision ID: f3fd88caeb0b
Revises: 5ad6a1856f20
Create Date: 2026-07-18 13:20:17.615195

"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3fd88caeb0b'
down_revision: str | None = '5ad6a1856f20'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.Uuid(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # updated_by on projects
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_by', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_projects_updated_by', 'users', ['updated_by'], ['id'], ondelete='SET NULL')

    # updated_by on tasks
    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_by', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_tasks_updated_by', 'users', ['updated_by'], ['id'], ondelete='SET NULL')

    # updated_by on notes
    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_by', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_notes_updated_by', 'users', ['updated_by'], ['id'], ondelete='SET NULL')

    # updated_by on milestones
    with op.batch_alter_table('milestones', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_by', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_milestones_updated_by', 'users', ['updated_by'], ['id'], ondelete='SET NULL')

    # updated_by on attachments
    with op.batch_alter_table('attachments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('updated_by', sa.Uuid(), nullable=True))
        batch_op.create_foreign_key('fk_attachments_updated_by', 'users', ['updated_by'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    with op.batch_alter_table('attachments', schema=None) as batch_op:
        batch_op.drop_constraint('fk_attachments_updated_by', type_='foreignkey')
        batch_op.drop_column('updated_by')

    with op.batch_alter_table('milestones', schema=None) as batch_op:
        batch_op.drop_constraint('fk_milestones_updated_by', type_='foreignkey')
        batch_op.drop_column('updated_by')

    with op.batch_alter_table('notes', schema=None) as batch_op:
        batch_op.drop_constraint('fk_notes_updated_by', type_='foreignkey')
        batch_op.drop_column('updated_by')

    with op.batch_alter_table('tasks', schema=None) as batch_op:
        batch_op.drop_constraint('fk_tasks_updated_by', type_='foreignkey')
        batch_op.drop_column('updated_by')

    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.drop_constraint('fk_projects_updated_by', type_='foreignkey')
        batch_op.drop_column('updated_by')

    op.drop_table('audit_logs')
