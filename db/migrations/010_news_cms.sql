-- News CMS.
--
-- The baseline schema created `news` with no draft state, and this loop runs on
-- every push, so ALTER TABLE ADD COLUMN is not available here: the second run
-- would fail with "duplicate column name". The editable state therefore lives in
-- its own table, one row per article, exactly as 007_catalog_details does for
-- item details. A missing row means the article is published, which is what the
-- announcements below rely on.

CREATE TABLE IF NOT EXISTS news_meta (
  news_id    INTEGER PRIMARY KEY REFERENCES news (id) ON DELETE CASCADE,
  published  INTEGER NOT NULL DEFAULT 1 CHECK (published IN (0, 1)),
  updated_at TEXT,
  edited_by  INTEGER REFERENCES users (id)
);

CREATE INDEX IF NOT EXISTS idx_news_meta_published ON news_meta (published);

-- The platform's own announcements, moved out of the phase 1 fixture file.
--
-- Only the posts that describe things that actually exist are carried over.
-- The fixture "Moderation team expanded" is deliberately not here: it names two
-- moderators who were never appointed, and a live database should not gain a
-- false announcement. An admin can write that post in the panel when it is true.
--
-- The author is the oldest account - the founder - because these are the
-- platform's announcements and the schema allows an account as the author, not a
-- byline. Nothing below inserts on a database with no members yet, so a fresh
-- install starts with an empty news page rather than an invented author, and the
-- empty page says so.

INSERT INTO news (slug, title, author_id, category, summary, body, published_at)
SELECT
  'fieldbrik-0-3-development-has-begun',
  'FieldBrik 0.3 development has begun',
  (SELECT id FROM users ORDER BY id ASC LIMIT 1),
  'Development',
  'A ground-up rebuild of the platform: new account system, central moderation, and a catalog that actually works.',
  'FieldBrik 0.3 is a rebuild rather than a refresh. Accounts, moderation, the catalog and the economy are being written from scratch, so that every part of the site shares one set of rules instead of each page enforcing its own.

The visible change is that every page now sits on one shared header and one design system. A change to the navigation lands everywhere at once, and a badge or a price is defined in one place rather than copied into twenty templates.

The order of work is deliberate: the whole website first, page by page, so that every link resolves and nothing is a dead end. Accounts and the database came next, then the catalog economy, then the forum. The client application comes last, because it needs a place editor to load places from.

Progress notes are posted here as each stage lands.',
  '2026-11-01T09:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM news WHERE slug = 'fieldbrik-0-3-development-has-begun');

INSERT INTO news (slug, title, author_id, category, summary, body, published_at)
SELECT
  'carpenters-club-tiers-and-prices',
  'Carpenters Club: the three tiers',
  (SELECT id FROM users ORDER BY id ASC LIMIT 1),
  'Community',
  'Standard, Senior and Outrageous, each available monthly, quarterly, yearly or permanently. The free service stays free.',
  'Carpenters Club is the optional membership. It adds recognition and supporting benefits; it does not gate building, publishing or playing, and it never will. Everything you need to use FieldBrik stays free.

There are three tiers - Carpenters Club, Carpenters Club Senior, and Outrageous Carpenters Club - and each can be bought monthly, quarterly, yearly, or permanently as a single payment that never renews. The full table of prices is on the Carpenters Club page.

Membership shows on your profile as a badge. That badge is granted from the account record on the server, so it cannot be added by editing anything in your browser.

Payment is not open yet. Nothing on the site can take money today, and this post will be updated when checkout exists.',
  '2026-10-26T09:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM news WHERE slug = 'carpenters-club-tiers-and-prices');

INSERT INTO news (slug, title, author_id, category, summary, body, published_at)
SELECT
  'tickets-economy-what-changes',
  'Tickets economy: what changes',
  (SELECT id FROM users ORDER BY id ASC LIMIT 1),
  'Development',
  'Item pricing moves to Tickets. Bucks remains the premium currency for future features.',
  'Tickets are the earned currency and now carry the catalog economy. Bucks remain the premium currency, and the two are linked at a rate of one Buck to ten Tickets, so an item priced at thirty Bucks also reads as three hundred Tickets.

Creators set their own prices. An item can be sold for Tickets, for Bucks, or for both, and the choice is made when the item is listed rather than being decided for you by the platform.

Balances are held in a ledger. Every change is a recorded transaction with the resulting balance attached, so a balance can always be explained by the entries behind it rather than being a number somebody typed.',
  '2026-10-18T09:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM news WHERE slug = 'tickets-economy-what-changes');
