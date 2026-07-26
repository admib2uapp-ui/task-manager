-- Orbit — Chat file-attachment storage bucket
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  TRUE,
  52428800,
  ARRAY[
    'image/*',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.ms-excel',
    'application/zip',
    'video/*',
    'text/*',
    'application/json'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read / upload to chat-attachments
CREATE POLICY "authenticated can read chat attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-attachments');

CREATE POLICY "authenticated can upload chat attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-attachments' AND auth.role() = 'authenticated');
