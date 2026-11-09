-- Place files. One row per publish, never overwritten.
--
-- A place is still the `games` row: its name, description, owner and published
-- flag. This table holds the world itself. The latest version is the highest
-- version number for that game, so a bad publish can be followed by a good one
-- without losing the file that was there before.
--
-- FieldBrik 0.7 writes XML places with a <roblox> root. That is text, so D1 can
-- hold it: there is no R2 binding in this project, and adding one would mean an
-- object store for a file the Worker must read and serve anyway. The 1.5 MB limit
-- is enforced in server/services/placeFiles.js, not here, so the refusal reads
-- as a sentence rather than a database error.

CREATE TABLE IF NOT EXISTS place_versions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id     INTEGER NOT NULL REFERENCES games (id) ON DELETE CASCADE,
  version     INTEGER NOT NULL CHECK (version > 0),
  filename    TEXT    NOT NULL,
  format      TEXT    NOT NULL CHECK (format IN ('fbrx', 'rbxl', 'rbxlx', 'xml')),
  size_bytes  INTEGER NOT NULL CHECK (size_bytes > 0),
  content     TEXT    NOT NULL,
  note        TEXT    NOT NULL DEFAULT '',
  created_by  INTEGER REFERENCES users (id),
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (game_id, version)
);

CREATE INDEX IF NOT EXISTS idx_place_versions_game
  ON place_versions (game_id, version DESC);
