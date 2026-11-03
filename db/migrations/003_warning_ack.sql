-- 003 - which warnings the member has seen.
--
-- A warning never blocks anything, so it is not a restriction the gate reads.
-- It is a message with a record attached, and the member's own page shows it
-- until they dismiss it. Dismissing writes a row here rather than editing the
-- restriction: the warning stays on the account's record, which is the point of
-- a warning.
--
-- A separate table instead of a column on restrictions, because this deploy
-- re-applies every migration on each push and ALTER TABLE has no IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS warning_acknowledgements (
  restriction_id  INTEGER PRIMARY KEY REFERENCES restrictions (id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  acknowledged_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_warning_ack_user ON warning_acknowledgements (user_id);
