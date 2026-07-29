-- Orbit -- Add status column to workspace_members for block/remove support
-- ---------------------------------------------------------------------------

ALTER TABLE workspace_members
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add index for efficient status-based queries
CREATE INDEX ix_workspace_members_status ON workspace_members (status);
