-- 002 - moderation: notes, username scrubs, evidence images, email blacklist.
--
-- Idempotent, because the deploy re-applies every migration on each push.
--
-- Evidence images live in D1 for now rather than R2. It is not where they
-- belong at scale, but it needs no bucket to exist before the feature works,
-- and moderation screenshots are small. The column is base64 text with a hard
-- 128 KB cap enforced in the service; moving to R2 later means swapping the
-- storage half of server/services/moderation.js and this table's data column.

CREATE TABLE IF NOT EXISTS account_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  author_id  INTEGER REFERENCES users (id),
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_account_notes_user ON account_notes (user_id, created_at);

-- A scrub is a rename, not a delete: the original name is kept here so an
-- account can still be identified by staff, and shown as CONTENT_DELETED_<id>
-- everywhere else.
CREATE TABLE IF NOT EXISTS username_scrubs (
  user_id           INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  original_username TEXT    NOT NULL,
  scrubbed_by       INTEGER REFERENCES users (id),
  scrubbed_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS blacklisted_emails (
  email_lower TEXT    PRIMARY KEY,
  reason      TEXT    NOT NULL DEFAULT '',
  added_by    INTEGER REFERENCES users (id),
  added_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One image per restriction, served by an unguessable token rather than a login,
-- because the person who needs to see it is the banned one, and they are being
-- refused a session at the time.
CREATE TABLE IF NOT EXISTS restriction_evidence (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  restriction_id INTEGER NOT NULL REFERENCES restrictions (id) ON DELETE CASCADE,
  content_type   TEXT    NOT NULL,
  bytes          INTEGER NOT NULL,
  data           TEXT    NOT NULL,
  access_token   TEXT    NOT NULL UNIQUE,
  uploaded_by    INTEGER REFERENCES users (id),
  uploaded_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_restriction ON restriction_evidence (restriction_id);
