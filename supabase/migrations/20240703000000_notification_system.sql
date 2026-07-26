-- Orbit — Notification & Communication System
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. Extend existing notifications table with new columns
-- ===========================================================================
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category      VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata      JSONB DEFAULT '{}';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_notifications_category
  ON notifications (category);

CREATE INDEX IF NOT EXISTS ix_notifications_user_read
  ON notifications (user_id, is_read, created_at DESC);

-- ===========================================================================
-- 2. notification_preferences — per-user email opt-in/opt-out
-- ===========================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignment_emails BOOLEAN NOT NULL DEFAULT TRUE,
  deadline_emails   BOOLEAN NOT NULL DEFAULT TRUE,
  chat_emails       BOOLEAN NOT NULL DEFAULT TRUE,
  github_emails     BOOLEAN NOT NULL DEFAULT TRUE,
  ai_emails         BOOLEAN NOT NULL DEFAULT TRUE,
  security_emails   BOOLEAN NOT NULL DEFAULT TRUE,
  workspace_emails  BOOLEAN NOT NULL DEFAULT TRUE,
  system_emails     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_preferences_user UNIQUE (user_id)
);

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 3. email_queue — queued outgoing emails, processed by Edge Function
-- ===========================================================================
CREATE TABLE IF NOT EXISTS email_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_email      VARCHAR(320) NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  subject       TEXT NOT NULL,
  data          JSONB NOT NULL DEFAULT '{}',
  priority      INTEGER NOT NULL DEFAULT 0,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts      INTEGER NOT NULL DEFAULT 0,
  max_attempts  INTEGER NOT NULL DEFAULT 3,
  last_error    TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_email_queue_pending
  ON email_queue (status, scheduled_for)
  WHERE status = 'pending';

-- ===========================================================================
-- 4. email_logs — audit trail for all sent emails
-- ===========================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id  UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_email        VARCHAR(320) NOT NULL,
  template_name   VARCHAR(100) NOT NULL,
  subject         TEXT NOT NULL,
  data            JSONB NOT NULL DEFAULT '{}',
  status          VARCHAR(20) NOT NULL,
  error           TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_email_logs_user
  ON email_logs (user_id, sent_at DESC);

-- ===========================================================================
-- 5. notification_templates — central template definitions
-- ===========================================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(100) NOT NULL UNIQUE,
  category            VARCHAR(50) NOT NULL,
  subject_template    TEXT NOT NULL,
  body_template       TEXT,
  email_template_name VARCHAR(100),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 6. scheduled_notifications — deadline reminders and scheduled alerts
-- ===========================================================================
CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          VARCHAR(50) NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT,
  entity_type   VARCHAR(50),
  entity_id     UUID,
  scheduled_for TIMESTAMPTZ NOT NULL,
  processed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_scheduled_notifications_due
  ON scheduled_notifications (scheduled_for, processed)
  WHERE processed = FALSE;

-- ===========================================================================
-- 7. Seed default notification templates
-- ===========================================================================
INSERT INTO notification_templates (name, category, subject_template, body_template, email_template_name) VALUES
  ('task_assigned',       'task',     'Task assigned to you: {{taskTitle}}',       'You have been assigned to task "{{taskTitle}}" in project "{{projectName}}".',           'task-assignment'),
  ('task_completed',      'task',     'Task completed: {{taskTitle}}',             'Task "{{taskTitle}}" has been marked as done.',                                            'task-completed'),
  ('task_created',        'task',     'New task: {{taskTitle}}',                   'A new task "{{taskTitle}}" has been created in project "{{projectName}}".',                'task-created'),
  ('task_reopened',       'task',     'Task reopened: {{taskTitle}}',              'Task "{{taskTitle}}" has been reopened.',                                                  'task-reopened'),
  ('priority_changed',    'task',     'Priority changed: {{taskTitle}}',           'Priority of "{{taskTitle}}" changed to {{priority}}.',                                    'priority-changed'),
  ('deadline_changed',    'task',     'Deadline changed: {{taskTitle}}',           'Deadline of "{{taskTitle}}" has been updated.',                                             'deadline-changed'),
  ('comment_added',       'task',     'New comment on {{taskTitle}}',              '{{authorName}} commented on "{{taskTitle}}".',                                             'comment-added'),
  ('project_created',     'project',  'New project: {{projectName}}',              'Project "{{projectName}}" has been created.',                                              'project-created'),
  ('project_archived',    'project',  'Project archived: {{projectName}}',         'Project "{{projectName}}" has been archived.',                                             'project-archived'),
  ('project_restored',    'project',  'Project restored: {{projectName}}',         'Project "{{projectName}}" has been restored.',                                             'project-restored'),
  ('member_joined',       'project',  'New member joined {{projectName}}',         '{{memberName}} has joined project "{{projectName}}".',                                     'member-joined'),
  ('member_removed',      'project',  'Member removed from {{projectName}}',       '{{memberName}} has been removed from project "{{projectName}}".',                          'member-removed'),
  ('project_completed',   'project',  'Project completed: {{projectName}}',        'Project "{{projectName}}" is now complete.',                                               'project-completed'),
  ('chat_mention',        'chat',     '{{authorName}} mentioned you',              'You were mentioned by {{authorName}} in {{projectName}} chat.',                            'chat-mention'),
  ('chat_reply',          'chat',     '{{authorName}} replied to your message',    '{{authorName}} replied to your message in {{projectName}} chat.',                           'chat-reply'),
  ('chat_reaction',       'chat',     '{{authorName}} reacted to your message',    '{{authorName}} reacted to your message in {{projectName}} chat.',                           'chat-reaction'),
  ('chat_new_message',    'chat',     'New message in {{projectName}}',            '{{authorName}} sent a message in {{projectName}} chat.',                                    'chat-new-message'),
  ('deadline_reminder',   'deadline', 'Deadline approaching: {{taskTitle}}',       'Task "{{taskTitle}}" is due {{timeRemaining}}.',                                           'deadline-reminder'),
  ('project_deadline',    'deadline', 'Project deadline approaching',              'Project "{{projectName}}" deadline is {{timeRemaining}}.',                                  'project-deadline'),
  ('workspace_invitation','workspace','You have been invited to {{workspaceName}}', 'You have been invited to join workspace "{{workspaceName}}".',                             'workspace-invitation'),
  ('ai_report_ready',     'ai',       'AI Report ready: {{reportName}}',           'Your AI report "{{reportName}}" is ready.',                                                 'ai-report'),
  ('github_analysis',     'github',   'GitHub analysis complete',                  'GitHub analysis for {{repoName}} is complete.',                                            'github-analysis'),
  ('security_alert',      'security', 'Security alert: {{alertType}}',             '{{alertType}}: {{details}}',                                                               'security-alert'),
  ('system_update',       'system',   'System update: {{updateTitle}}',            '{{updateBody}}',                                                                          'system-update')
ON CONFLICT (name) DO NOTHING;

-- ===========================================================================
-- RLS: all new tables DISABLE ROW LEVEL SECURITY (matching existing pattern)
-- ===========================================================================
ALTER TABLE notification_preferences   DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue                DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates     DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications    DISABLE ROW LEVEL SECURITY;

-- Note: notifications is already in supabase_realtime from initial migration
