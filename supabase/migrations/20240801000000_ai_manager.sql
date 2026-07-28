-- Orbit — AI Project Manager Assistant tables
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. ai_conversations — one conversation per user workspace session
-- ===========================================================================
CREATE TABLE ai_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  title        VARCHAR(200) NOT NULL DEFAULT 'AI Assistant',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_ai_conversations_user_id ON ai_conversations (user_id);
CREATE INDEX ix_ai_conversations_workspace_id ON ai_conversations (workspace_id);
CREATE INDEX ix_ai_conversations_project_id ON ai_conversations (project_id);

CREATE TRIGGER trg_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 2. ai_messages — messages within a conversation
-- ===========================================================================
CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(20) NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  action_plan     JSONB,
  context         JSONB,
  status          VARCHAR(20) NOT NULL DEFAULT 'completed'
                  CHECK (status IN ('pending','approved','rejected','executed','failed')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_ai_messages_conversation_id ON ai_messages (conversation_id);

-- ===========================================================================
-- 3. ai_action_logs — execution audit trail for AI-driven actions
-- ===========================================================================
CREATE TABLE ai_action_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
  action_type  VARCHAR(40) NOT NULL,
  entity_type  VARCHAR(40) NOT NULL,
  entity_id    UUID,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','completed','failed')),
  details      JSONB,
  error        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_ai_action_logs_message_id ON ai_action_logs (message_id);

-- ===========================================================================
-- Enable Realtime for AI conversations
-- ===========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_messages;
