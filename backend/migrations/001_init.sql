-- Notes and file metadata. UUIDs are supplied by callers so imports can
-- preserve source IDs. Timestamps default to now() but imports set them
-- explicitly to preserve source dates.

CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id           UUID PRIMARY KEY,
  note_id      UUID REFERENCES notes (id) ON DELETE SET NULL,
  file_name    TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes   BIGINT NOT NULL DEFAULT 0,
  storage_key  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded')),
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS files_note_id_idx ON files (note_id);
