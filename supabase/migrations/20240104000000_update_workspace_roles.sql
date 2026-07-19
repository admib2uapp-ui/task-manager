-- Orbit -- Migrate old workspace roles to new role names
-- ---------------------------------------------------------------------------
-- Mapping: admin -> senior, member -> general, viewer -> junior
-- ---------------------------------------------------------------------------

ALTER TABLE workspace_members ALTER COLUMN role SET DEFAULT 'general';

UPDATE workspace_members SET role = 'senior'  WHERE role = 'admin';
UPDATE workspace_members SET role = 'general'  WHERE role = 'member';
UPDATE workspace_members SET role = 'junior'   WHERE role = 'viewer';
