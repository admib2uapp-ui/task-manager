-- Safe migration: extend orbit_idea_status and add multi-member support
-- This migration is additive — no existing data is altered or destroyed.

-- ===========================================================================
-- 1. Extend orbit_idea_status enum with new workflow states
--    Each ADD VALUE uses IF NOT EXISTS to be idempotent.
-- ===========================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orbit_idea_status') THEN
    CREATE TYPE orbit_idea_status AS ENUM (
      'backlog', 'draft', 'submitted', 'planned', 'approved',
      'development', 'testing', 'review', 'completed', 'rejected', 'archived'
    );
  ELSE
    -- Add each new value safely
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'backlog') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'backlog' BEFORE 'draft';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'planned') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'planned' AFTER 'approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'development') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'development' AFTER 'planned';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'testing') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'testing' AFTER 'development';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'review') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'review' AFTER 'testing';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'completed') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'completed' AFTER 'review';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'orbit_idea_status'::regtype AND enumlabel = 'rejected') THEN
      ALTER TYPE orbit_idea_status ADD VALUE 'rejected' AFTER 'completed';
    END IF;
  END IF;
END $$;

-- ===========================================================================
-- 2. orbit_idea_members — junction table for multiple assigned members
-- ===========================================================================
CREATE TABLE IF NOT EXISTS orbit_idea_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  idea_id    UUID NOT NULL REFERENCES orbit_ideas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL DEFAULT 'member',
  CONSTRAINT uq_idea_member UNIQUE (idea_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_orbit_idea_members_idea_id ON orbit_idea_members (idea_id);
CREATE INDEX IF NOT EXISTS ix_orbit_idea_members_user_id ON orbit_idea_members (user_id);

-- ===========================================================================
-- 3. Enable Realtime for the new table
-- ===========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS orbit_idea_members;
