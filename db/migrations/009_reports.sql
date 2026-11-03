-- 009 - abuse reports.
--
-- One row per report, from a member about a member or about a message they
-- received. The queue is read from `status = 'open'`, so closing a report is an
-- update and the row stays as history rather than being deleted.
--
-- Re-runnable like every other migration here: the deploy applies all of them on
-- each push, so this is CREATE TABLE IF NOT EXISTS only.
--
-- target_user_id is the account being reported and is always filled in, even for
-- a message report, because "who is this about" is the question the panel asks
-- most. message_id is the specific message when there is one, and it cascades:
-- deleting a message does not leave a report pointing at nothing.

CREATE TABLE IF NOT EXISTS reports (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind           TEXT    NOT NULL CHECK (kind IN ('member', 'message')),
  target_user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  message_id     INTEGER REFERENCES messages (id) ON DELETE CASCADE,
  -- Fixed keys from server/services/reports.js, never free text from the form.
  reason         TEXT    NOT NULL,
  detail         TEXT    NOT NULL DEFAULT '',
  status         TEXT    NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'handled', 'dismissed')),
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  handled_by     INTEGER REFERENCES users (id),
  handled_at     TEXT,
  note           TEXT    NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_reports_status   ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target   ON reports (target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports (reporter_id, created_at DESC);
