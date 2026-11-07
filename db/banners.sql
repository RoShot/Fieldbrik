-- Site banners: the strip that runs under the member strip.
--
-- One row per banner. The newest enabled row is the one the site draws, so
-- publishing a new one is a save rather than an edit of the old one, and the
-- old ones stay here as a record of what ran.
--
-- The application also creates this table itself on first use (services/banners
-- does a CREATE TABLE IF NOT EXISTS once per process), because the deployed
-- database has no migration step. This file is for a fresh local database, and
-- is the definition to read.

CREATE TABLE IF NOT EXISTS banners (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT    NOT NULL,
  bg         TEXT    NOT NULL DEFAULT '#efefef',
  fg         TEXT    NOT NULL DEFAULT '#1e1e1e',
  link       TEXT,
  enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by INTEGER REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_banners_enabled ON banners (enabled, id);
