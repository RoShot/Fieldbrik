-- Description and image for a catalog item.
--
-- These live in their own table rather than as new columns on catalog_items
-- because migrations are re-applied on every deploy and SQLite has no
-- "ADD COLUMN IF NOT EXISTS": a second run would fail. A separate table keyed by
-- item id is idempotent with CREATE TABLE IF NOT EXISTS, and the item row keeps
-- the columns it was designed with.
--
-- image holds a path under public/, e.g. '/img/catalog/hat.png'. An item with no
-- image is drawn as its colour swatch, so a missing file is never a broken image.

CREATE TABLE IF NOT EXISTS catalog_item_details (
  item_id     INTEGER PRIMARY KEY REFERENCES catalog_items (id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  image       TEXT NOT NULL DEFAULT ''
);
