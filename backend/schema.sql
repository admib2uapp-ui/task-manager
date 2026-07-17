-- Orbit — Complete database schema
-- Paste this entire script into the Supabase SQL Editor and run it once.
-- ---------------------------------------------------------------------------

-- Extension required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helper: auto-update updated_at on every row change
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 1. users
-- ===========================================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email           VARCHAR(320) NOT NULL,
  name            VARCHAR(120) NOT NULL,
  hashed_password VARCHAR(1024) NOT NULL,
  avatar_url      VARCHAR(1024),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  github_token    TEXT,
  github_login    VARCHAR(100)
);
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 2. workspaces
-- ===========================================================================
CREATE TABLE workspaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        VARCHAR(120) NOT NULL,
  slug        VARCHAR(140) NOT NULL,
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX ix_workspaces_slug ON workspaces (slug);
CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 3. workspace_members
-- ===========================================================================
CREATE TABLE workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL DEFAULT 'member',
  CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);
CREATE TRIGGER trg_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 4. tags
-- ===========================================================================
CREATE TABLE tags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         VARCHAR(50) NOT NULL,
  color        VARCHAR(9) NOT NULL DEFAULT '#3b82f6',
  CONSTRAINT uq_tag_workspace_name UNIQUE (workspace_id, name)
);
CREATE TRIGGER trg_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 5. projects
-- ===========================================================================
CREATE TABLE projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name           VARCHAR(160) NOT NULL,
  description    TEXT,
  color          VARCHAR(9) NOT NULL DEFAULT '#3b82f6',
  icon           VARCHAR(40) NOT NULL DEFAULT 'folder',
  status         VARCHAR(20) NOT NULL DEFAULT 'active',
  deadline       TIMESTAMPTZ,
  repository_url VARCHAR(1024),
  is_favorite    BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived    BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_projects_workspace_id ON projects (workspace_id);
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 6. project_tags (association)
-- ===========================================================================
CREATE TABLE project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- ===========================================================================
-- 7. milestones
-- ===========================================================================
CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(160) NOT NULL,
  description TEXT,
  due_date    TIMESTAMPTZ,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  position    FLOAT NOT NULL DEFAULT 0
);
CREATE INDEX ix_milestones_project_id ON milestones (project_id);
CREATE TRIGGER trg_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 8. tasks
-- ===========================================================================
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title             VARCHAR(300) NOT NULL,
  description       TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'backlog',
  priority          VARCHAR(20) NOT NULL DEFAULT 'medium',
  position          FLOAT NOT NULL DEFAULT 0,
  assignee_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  deadline          TIMESTAMPTZ,
  estimated_hours   FLOAT,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  github_repo_url   VARCHAR(1024),
  github_issue_url  VARCHAR(1024),
  github_pr_url     VARCHAR(1024),
  github_branch     VARCHAR(255),
  is_pinned         BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_tasks_project_id ON tasks (project_id);
CREATE INDEX ix_tasks_status ON tasks (status);
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 9. subtasks
-- ===========================================================================
CREATE TABLE subtasks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title      VARCHAR(300) NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  position   FLOAT NOT NULL DEFAULT 0
);
CREATE INDEX ix_subtasks_task_id ON subtasks (task_id);
CREATE TRIGGER trg_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 10. checklist_items
-- ===========================================================================
CREATE TABLE checklist_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  content    VARCHAR(500) NOT NULL,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  position   FLOAT NOT NULL DEFAULT 0
);
CREATE INDEX ix_checklist_items_task_id ON checklist_items (task_id);
CREATE TRIGGER trg_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 11. comments
-- ===========================================================================
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  body       TEXT NOT NULL
);
CREATE INDEX ix_comments_task_id ON comments (task_id);
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 12. task_tags (association)
-- ===========================================================================
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- ===========================================================================
-- 13. task_dependencies (association)
-- ===========================================================================
CREATE TABLE task_dependencies (
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id),
  CONSTRAINT ck_no_self_dependency CHECK (task_id <> depends_on_id)
);

-- ===========================================================================
-- 14. time_entries
-- ===========================================================================
CREATE TABLE time_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id          UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  description      TEXT,
  started_at       TIMESTAMPTZ NOT NULL,
  ended_at         TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX ix_time_entries_user_id ON time_entries (user_id);
CREATE INDEX ix_time_entries_started_at ON time_entries (started_at);
CREATE TRIGGER trg_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 15. notes
-- ===========================================================================
CREATE TABLE notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  title        VARCHAR(200) NOT NULL,
  content      TEXT NOT NULL DEFAULT ''
);
CREATE INDEX ix_notes_workspace_id ON notes (workspace_id);
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 16. notifications
-- ===========================================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,
  title       VARCHAR(255) NOT NULL,
  body        TEXT,
  entity_type VARCHAR(20),
  entity_id   UUID,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_notifications_user_id ON notifications (user_id);
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 17. attachments
-- ===========================================================================
CREATE TABLE attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name   VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_url    VARCHAR(1024) NOT NULL,
  mime_type   VARCHAR(120) NOT NULL,
  size_bytes  INTEGER NOT NULL
);
CREATE INDEX ix_attachments_task_id ON attachments (task_id);
CREATE TRIGGER trg_attachments_updated_at
  BEFORE UPDATE ON attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 18. repository_connections
-- ===========================================================================
CREATE TABLE repository_connections (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_owner        VARCHAR(100) NOT NULL,
  github_repo         VARCHAR(100) NOT NULL,
  provider            VARCHAR(20) NOT NULL DEFAULT 'github',
  token_type          VARCHAR(20) NOT NULL DEFAULT 'oauth',
  encrypted_token     TEXT NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at      TIMESTAMPTZ,
  repository_metadata JSONB
);
CREATE TRIGGER trg_repository_connections_updated_at
  BEFORE UPDATE ON repository_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 19. repository_scans
-- ===========================================================================
CREATE TABLE repository_scans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connection_id     UUID NOT NULL REFERENCES repository_connections(id) ON DELETE CASCADE,
  scan_type         VARCHAR(20) NOT NULL DEFAULT 'full',
  status            VARCHAR(20) NOT NULL DEFAULT 'pending',
  task_id           VARCHAR(255),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  commit_hash       VARCHAR(40),
  commit_message    TEXT,
  file_count        INTEGER NOT NULL DEFAULT 0,
  total_lines       INTEGER NOT NULL DEFAULT 0,
  total_size_bytes  INTEGER NOT NULL DEFAULT 0,
  language_breakdown JSONB,
  error_message     TEXT
);
CREATE INDEX ix_repository_scans_connection_id ON repository_scans (connection_id);
CREATE TRIGGER trg_repository_scans_updated_at
  BEFORE UPDATE ON repository_scans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 20. code_issues
-- ===========================================================================
CREATE TABLE code_issues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scan_id     UUID NOT NULL REFERENCES repository_scans(id) ON DELETE CASCADE,
  file_path   VARCHAR(500) NOT NULL,
  line_start  INTEGER,
  line_end    INTEGER,
  issue_type  VARCHAR(100) NOT NULL,
  severity    VARCHAR(20) NOT NULL,
  category    VARCHAR(50) NOT NULL,
  title       VARCHAR(500) NOT NULL,
  message     TEXT,
  suggestion  TEXT,
  language    VARCHAR(50),
  rule_id     VARCHAR(100),
  metadata    JSONB,
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_code_issues_scan_id ON code_issues (scan_id);
CREATE TRIGGER trg_code_issues_updated_at
  BEFORE UPDATE ON code_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 21. repository_metrics
-- ===========================================================================
CREATE TABLE repository_metrics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scan_id      UUID NOT NULL REFERENCES repository_scans(id) ON DELETE CASCADE,
  metric_name  VARCHAR(100) NOT NULL,
  metric_value FLOAT NOT NULL,
  category     VARCHAR(50),
  dimension    VARCHAR(50),
  metadata     JSONB
);
CREATE INDEX ix_repository_metrics_scan_id ON repository_metrics (scan_id);
CREATE TRIGGER trg_repository_metrics_updated_at
  BEFORE UPDATE ON repository_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 22. ai_repository_reports
-- ===========================================================================
CREATE TABLE ai_repository_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scan_id       UUID NOT NULL REFERENCES repository_scans(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  report_type   VARCHAR(50) NOT NULL,
  title         VARCHAR(500) NOT NULL,
  summary       TEXT,
  full_content  TEXT,
  scores        JSONB,
  generated_by  VARCHAR(100),
  metadata      JSONB
);
CREATE INDEX ix_ai_repository_reports_scan_id ON ai_repository_reports (scan_id);
CREATE TRIGGER trg_ai_repository_reports_updated_at
  BEFORE UPDATE ON ai_repository_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 23. repository_scores
-- ===========================================================================
CREATE TABLE repository_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scan_id         UUID NOT NULL REFERENCES repository_scans(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  overall         FLOAT NOT NULL DEFAULT 0,
  architecture    FLOAT NOT NULL DEFAULT 0,
  code_quality    FLOAT NOT NULL DEFAULT 0,
  security        FLOAT NOT NULL DEFAULT 0,
  performance     FLOAT NOT NULL DEFAULT 0,
  testing         FLOAT NOT NULL DEFAULT 0,
  documentation   FLOAT NOT NULL DEFAULT 0,
  maintainability FLOAT NOT NULL DEFAULT 0,
  technical_debt  FLOAT NOT NULL DEFAULT 0,
  complexity      FLOAT NOT NULL DEFAULT 0,
  dx_score        FLOAT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX ix_repository_scores_scan_id ON repository_scores (scan_id);
CREATE TRIGGER trg_repository_scores_updated_at
  BEFORE UPDATE ON repository_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 24. repository_chats
-- ===========================================================================
CREATE TABLE repository_chats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES repository_connections(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  answer        TEXT,
  context       JSONB,
  model         VARCHAR(100)
);
CREATE INDEX ix_repository_chats_connection_id ON repository_chats (connection_id);
CREATE TRIGGER trg_repository_chats_updated_at
  BEFORE UPDATE ON repository_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- Disable Row Level Security on all tables (unrestricted access)
-- ===========================================================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE repository_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE repository_scans DISABLE ROW LEVEL SECURITY;
ALTER TABLE code_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE repository_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_repository_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE repository_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE repository_chats DISABLE ROW LEVEL SECURITY;
