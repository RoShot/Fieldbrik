-- Site settings the panel can change.
--
-- A key/value table rather than a column per setting: a new rate should not
-- need a migration, and a missing key must fall back to a documented default
-- rather than to zero. The service that reads this (server/services/settings.js)
-- owns the defaults; this file only seeds the ones that should be visible and
-- editable from the first deploy.
--
-- Every insert is INSERT OR IGNORE so the deploy's repeated run never overwrites
-- a value an administrator has since changed.

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_by INTEGER REFERENCES users (id)
);

-- Earning rates. Tickets per day, and the club bonus on top of them.
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('earn.daily.tickets',                          '100'),
  ('earn.daily.tickets.carpenters_club',          '150'),
  ('earn.daily.tickets.carpenters_club_senior',   '300'),
  ('earn.daily.tickets.outrageous_carpenters_club','500'),
  ('earn.daily.bucks.outrageous_carpenters_club', '25'),
  ('earn.visits.block',                           '10'),
  ('earn.visits.tickets',                         '500');
