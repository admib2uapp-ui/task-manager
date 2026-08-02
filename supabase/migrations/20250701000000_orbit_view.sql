-- Orbit View — Enterprise Visual Project Workspace
-- Extends existing schema with orbit-specific tables.
-- No existing tables are modified.

-- ===========================================================================
-- Enums
-- ===========================================================================
CREATE TYPE orbit_idea_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE orbit_idea_status AS ENUM ('draft', 'submitted', 'approved', 'archived');
CREATE TYPE orbit_regression_status AS ENUM ('pending', 'passing', 'failing', 'regression');
CREATE TYPE orbit_sprint_status AS ENUM ('planning', 'active', 'completed');
CREATE TYPE orbit_risk_type AS ENUM (
  'blocked_task', 'overdue_work', 'missing_review', 'high_priority_bug',
  'critical_issue', 'failed_testing', 'dependency_conflict', 'performance',
  'security', 'resource'
);
CREATE TYPE orbit_risk_status AS ENUM ('active', 'mitigated', 'resolved');

-- ===========================================================================
-- 1. orbit_ideas — standalone ideas for the Ideas Hub
-- ===========================================================================
CREATE TABLE orbit_ideas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
  title             VARCHAR(300) NOT NULL,
  description       TEXT,
  rich_text         JSONB,
  priority          orbit_idea_priority NOT NULL DEFAULT 'medium',
  category          VARCHAR(60),
  labels            JSONB DEFAULT '[]',
  assignee_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  estimated_hours   FLOAT,
  due_date          TIMESTAMPTZ,
  status            orbit_idea_status NOT NULL DEFAULT 'draft',
  ai_summary        TEXT,
  github_links      JSONB DEFAULT '[]',
  related_task_ids  UUID[] DEFAULT '{}',
  related_file_urls TEXT[] DEFAULT '{}',
  created_by        UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX ix_orbit_ideas_workspace_id ON orbit_ideas (workspace_id);
CREATE INDEX ix_orbit_ideas_project_id ON orbit_ideas (project_id);
CREATE INDEX ix_orbit_ideas_status ON orbit_ideas (status);
CREATE TRIGGER trg_orbit_ideas_updated_at
  BEFORE UPDATE ON orbit_ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 2. orbit_idea_votes
-- ===========================================================================
CREATE TABLE orbit_idea_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idea_id    UUID NOT NULL REFERENCES orbit_ideas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_idea_vote UNIQUE (idea_id, user_id)
);
CREATE INDEX ix_orbit_idea_votes_idea_id ON orbit_idea_votes (idea_id);

-- ===========================================================================
-- 3. orbit_idea_reactions
-- ===========================================================================
CREATE TABLE orbit_idea_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idea_id    UUID NOT NULL REFERENCES orbit_ideas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      VARCHAR(10) NOT NULL,
  CONSTRAINT uq_idea_reaction UNIQUE (idea_id, user_id, emoji)
);
CREATE INDEX ix_orbit_idea_reactions_idea_id ON orbit_idea_reactions (idea_id);

-- ===========================================================================
-- 4. orbit_testing_metadata — extends existing tasks with testing data
-- ===========================================================================
CREATE TABLE orbit_testing_metadata (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  qa_checklist        JSONB DEFAULT '[]',
  test_cases          JSONB DEFAULT '[]',
  pass_count          INTEGER NOT NULL DEFAULT 0,
  fail_count          INTEGER NOT NULL DEFAULT 0,
  bug_report_ids      UUID[] DEFAULT '{}',
  screenshot_urls     TEXT[] DEFAULT '{}',
  screen_recording_urls TEXT[] DEFAULT '{}',
  test_notes          TEXT,
  regression_status   orbit_regression_status NOT NULL DEFAULT 'pending',
  testing_progress    FLOAT NOT NULL DEFAULT 0,
  tester_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  tested_at           TIMESTAMPTZ,
  CONSTRAINT uq_testing_metadata_task UNIQUE (task_id)
);
CREATE INDEX ix_orbit_testing_metadata_task_id ON orbit_testing_metadata (task_id);
CREATE TRIGGER trg_orbit_testing_metadata_updated_at
  BEFORE UPDATE ON orbit_testing_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 5. orbit_sprints
-- ===========================================================================
CREATE TABLE orbit_sprints (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(160) NOT NULL,
  goal        TEXT,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ NOT NULL,
  status      orbit_sprint_status NOT NULL DEFAULT 'planning',
  velocity    FLOAT NOT NULL DEFAULT 0
);
CREATE INDEX ix_orbit_sprints_project_id ON orbit_sprints (project_id);
CREATE TRIGGER trg_orbit_sprints_updated_at
  BEFORE UPDATE ON orbit_sprints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 6. orbit_sprint_tasks
-- ===========================================================================
CREATE TABLE orbit_sprint_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sprint_id   UUID NOT NULL REFERENCES orbit_sprints(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  story_points FLOAT NOT NULL DEFAULT 0,
  CONSTRAINT uq_sprint_task UNIQUE (sprint_id, task_id)
);
CREATE INDEX ix_orbit_sprint_tasks_sprint_id ON orbit_sprint_tasks (sprint_id);

-- ===========================================================================
-- 7. orbit_risk_nodes
-- ===========================================================================
CREATE TABLE orbit_risk_nodes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  entity_type          VARCHAR(30) NOT NULL,
  entity_id            UUID NOT NULL,
  risk_score           FLOAT NOT NULL DEFAULT 0,
  risk_type            orbit_risk_type NOT NULL,
  status               orbit_risk_status NOT NULL DEFAULT 'active',
  owner_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_suggestion TEXT,
  risk_timeline        JSONB DEFAULT '[]'
);
CREATE INDEX ix_orbit_risk_nodes_project_id ON orbit_risk_nodes (project_id);
CREATE INDEX ix_orbit_risk_nodes_status ON orbit_risk_nodes (status);
CREATE TRIGGER trg_orbit_risk_nodes_updated_at
  BEFORE UPDATE ON orbit_risk_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 8. project_analytics_snapshots
-- ===========================================================================
CREATE TABLE project_analytics_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data          JSONB NOT NULL DEFAULT '{}',
  CONSTRAINT uq_project_snapshot_date UNIQUE (project_id, snapshot_date)
);
CREATE INDEX ix_project_analytics_snapshots_project_id ON project_analytics_snapshots (project_id);

-- ===========================================================================
-- 9. orbit_card_links — links ideas to tasks for traceability
-- ===========================================================================
CREATE TABLE orbit_card_links (
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idea_id    UUID NOT NULL REFERENCES orbit_ideas(id) ON DELETE CASCADE,
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (idea_id, task_id)
);
CREATE INDEX ix_orbit_card_links_task_id ON orbit_card_links (task_id);

-- ===========================================================================
-- Enable Realtime for all orbit tables
-- ===========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_idea_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_idea_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_testing_metadata;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_sprint_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_risk_nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE project_analytics_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE orbit_card_links;
