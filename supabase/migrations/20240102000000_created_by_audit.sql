-- Orbit — Add created_by/updated_by + audit_logs table
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Add created_by / updated_by columns to existing tables
-- ---------------------------------------------------------------------------

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE milestones
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE attachments
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2. Audit logs table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);
