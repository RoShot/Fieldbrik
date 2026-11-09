-- Place thumbnails.
--
-- A thumbnail is the small picture on a place page and on every tile that links
-- to it. It is stored as base64 text beside the place rather than in a bucket:
-- the same code path then runs in the Worker and in Express, and a 320x200 JPEG
-- is a few tens of KB, far inside D1's row limit.
--
-- A table rather than three columns on games. This loop runs on every push, and
-- ALTER TABLE has no IF NOT EXISTS, so a second run would fail with "duplicate
-- column name" - the same reason 003, 010 and 011 add table pairs instead of
-- columns. A missing row means no thumbnail, which keeps the colour swatch every
-- place had before this pass.

CREATE TABLE IF NOT EXISTS place_thumbnails (
  game_id      INTEGER PRIMARY KEY REFERENCES games (id) ON DELETE CASCADE,
  content      TEXT    NOT NULL,
  content_type TEXT    NOT NULL CHECK (content_type IN ('image/png', 'image/jpeg')),
  updated_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
