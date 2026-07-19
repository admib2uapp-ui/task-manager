-- Orbit -- Create project_members table for per-project access control
-- ---------------------------------------------------------------------------

CREATE TABLE project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL DEFAULT 'general',
  CONSTRAINT uq_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX ix_project_members_project_id ON project_members (project_id);
CREATE INDEX ix_project_members_user_id ON project_members (user_id);

CREATE TRIGGER trg_project_members_updated_at
  BEFORE UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed existing project creators as project members with role 'owner'
INSERT INTO project_members (project_id, user_id, role)
SELECT id, created_by, 'owner'
FROM projects
WHERE created_by IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Add index on tasks.assignee_id for performance
CREATE INDEX ix_tasks_assignee_id ON tasks (assignee_id);
