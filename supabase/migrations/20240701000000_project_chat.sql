-- Orbit — Project Chat module
-- ---------------------------------------------------------------------------

-- ===========================================================================
-- 1. project_chats — one row per project, auto-created when first accessed
-- ===========================================================================
CREATE TABLE project_chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX ix_project_chats_project_id ON project_chats (project_id);
CREATE TRIGGER trg_project_chats_updated_at
  BEFORE UPDATE ON project_chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 2. chat_messages
-- ===========================================================================
CREATE TABLE chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chat_id     UUID NOT NULL REFERENCES project_chats(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  thread_id   UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
  is_edited   BOOLEAN NOT NULL DEFAULT FALSE,
  edited_at   TIMESTAMPTZ
);
CREATE INDEX ix_chat_messages_chat_id_created ON chat_messages (chat_id, created_at DESC);
CREATE INDEX ix_chat_messages_thread_id ON chat_messages (thread_id);
CREATE INDEX ix_chat_messages_reply_to ON chat_messages (reply_to_id);
CREATE TRIGGER trg_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 3. chat_reactions
-- ===========================================================================
CREATE TABLE chat_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      VARCHAR(50) NOT NULL,
  CONSTRAINT uq_chat_reaction UNIQUE (message_id, user_id, emoji)
);
CREATE INDEX ix_chat_reactions_message_id ON chat_reactions (message_id);
CREATE TRIGGER trg_chat_reactions_updated_at
  BEFORE UPDATE ON chat_reactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 4. chat_read_receipts
-- ===========================================================================
CREATE TABLE chat_read_receipts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_chat_read_receipt UNIQUE (message_id, user_id)
);
CREATE INDEX ix_chat_read_receipts_message_id ON chat_read_receipts (message_id);
CREATE INDEX ix_chat_read_receipts_user_id ON chat_read_receipts (user_id);

-- ===========================================================================
-- 5. chat_attachments
-- ===========================================================================
CREATE TABLE chat_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id  UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  file_name   VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  file_url    VARCHAR(1024) NOT NULL,
  mime_type   VARCHAR(120) NOT NULL,
  size_bytes  INTEGER NOT NULL
);
CREATE INDEX ix_chat_attachments_message_id ON chat_attachments (message_id);
CREATE TRIGGER trg_chat_attachments_updated_at
  BEFORE UPDATE ON chat_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 6. chat_mentions
-- ===========================================================================
CREATE TABLE chat_mentions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_chat_mention UNIQUE (message_id, user_id)
);
CREATE INDEX ix_chat_mentions_message_id ON chat_mentions (message_id);
CREATE INDEX ix_chat_mentions_user_id ON chat_mentions (user_id);

-- ===========================================================================
-- 7. chat_pins
-- ===========================================================================
CREATE TABLE chat_pins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chat_id    UUID NOT NULL REFERENCES project_chats(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  pinned_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_chat_pin UNIQUE (chat_id, message_id)
);
CREATE INDEX ix_chat_pins_chat_id ON chat_pins (chat_id);
CREATE TRIGGER trg_chat_pins_updated_at
  BEFORE UPDATE ON chat_pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- RLS disabled (matching existing pattern — auth handled server-side)
-- ===========================================================================
ALTER TABLE project_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_reactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_read_receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mentions DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_pins DISABLE ROW LEVEL SECURITY;

-- ===========================================================================
-- Enable Realtime for chat_messages
-- ===========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
