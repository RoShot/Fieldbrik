-- Seed data for FieldBrik 0.3.
--
-- This file contains site structure only: badge definitions, forum sections and
-- the items the site itself sells. It deliberately does not create members,
-- places or posts. Those are user data, and inventing them would put fake
-- accounts into a real database. The first real account is created through
-- registration.

-- Badge definitions. The key is what user_badges stores, so these strings must
-- match the role names, the Carpenters Club tiers and the file names chosen for
-- the artwork (see server/services/badges.js for which have a drawing).
-- `color` is the fallback pip, still used by badges with no art yet.
INSERT INTO badges (key, name, description, color) VALUES
  ('super_administrator',        'Super Administrator',     'Runs the platform.', '#8a2f2f'),
  ('administrator',              'Administrator',           'Administers the platform.', '#a8471f'),
  ('image_moderator',            'Image Moderator',         'Reviews images and assets.', '#2f8f8a'),
  ('forum_moderator',            'Forum Moderator',         'Keeps the forum in order.', '#4f6fb5'),
  ('carpenters_club',            'Carpenters Club',         'Held a Carpenters Club membership.', '#a9822f'),
  ('carpenters_club_senior',     'Carpenters Club Senior',  'Held a Carpenters Club Senior membership.', '#8a6a1f'),
  ('outrageous_carpenters_club', 'Outrageous Carpenters Club', 'Held an Outrageous Carpenters Club membership.', '#6a4a8a'),
  ('official_model_maker',       'Official Model Maker',    'Awarded by staff for a model worth keeping.', '#b5762f'),
  ('ambassador',                 'Ambassador',              'Linked this account to three or more platforms.', '#5f8f8f'),
  ('one_year',                   'One Year',                'Active on FieldBrik for a year or more.', '#8a8a8a'),
  ('friends_20',                 '20 Friends',              'Made twenty friends.', '#b0508a'),
  ('referral',                   'Inviter',                 'Invited a member who joined.', '#6f5fb5'),
  ('brikker',                    'Brikker',                 '150 knockouts in games with combat.', '#a8412f'),
  ('combat_initiation',          'Combat Initiation',       '10 knockouts in games with combat.', '#8f5f2f'),
  ('warrior',                    'Warrior',                 '1,500 knockouts in games with combat.', '#7a2f2f'),
  ('briksmith',                  'Briksmith',               '100 visits on a place you built.', '#5f7a2f'),
  ('homestead',                  'Homestead',               '500 visits on a place you built.', '#2f7a5f')
ON CONFLICT (key) DO UPDATE SET
  name        = excluded.name,
  description = excluded.description,
  color       = excluded.color;

-- Forum sections. These are the site's own structure, not posted content.
INSERT INTO forum_sections (slug, name, description, position, staff_only) VALUES
  ('announcements', 'Announcements',      'Platform news, maintenance windows and development updates from the team.', 1, 1),
  ('help',          'Help and Support',   'Account problems, bug reports and questions about how FieldBrik works.',   2, 0),
  ('building',      'Building',           'Construction techniques, brick palettes, and showing off what you have made.', 3, 0),
  ('scripting',     'Scripting and Logic','Making things move. Switches, doors, traps and the logic that drives them.', 4, 0),
  ('general',       'Off Topic',          'Everything that does not belong in the sections above.',                   5, 0)
ON CONFLICT (slug) DO UPDATE SET
  name        = excluded.name,
  description = excluded.description,
  position    = excluded.position,
  staff_only  = excluded.staff_only;

-- Official catalog items.
--
-- These are what the site sells, so they ship with the site the way badge and
-- forum definitions do. A catalog row needs an owner, and there is no separate
-- "FieldBrik" account, so the creator is the oldest account - the founder, who
-- is the first person to register.
--
-- Every statement below is a no-op on a database with no members yet (the
-- subquery for the creator returns nothing, so nothing is inserted) and a no-op
-- on a later run once the row exists. Names are the key: renaming an item in the
-- panel creates a new row rather than editing this one, which is why the details
-- are attached by name here.
INSERT INTO catalog_items (name, category, creator_id, tickets, bucks, on_sale)
SELECT 'Astronaut Helmet', 'Hats', (SELECT id FROM users ORDER BY id ASC LIMIT 1), 115, 15, 1
 WHERE EXISTS (SELECT 1 FROM users)
   AND NOT EXISTS (SELECT 1 FROM catalog_items WHERE name = 'Astronaut Helmet');

INSERT INTO catalog_items (name, category, creator_id, tickets, bucks, on_sale)
SELECT 'Black Iron Crown of Pwnage', 'Hats', (SELECT id FROM users ORDER BY id ASC LIMIT 1), 4000, 500, 1
 WHERE EXISTS (SELECT 1 FROM users)
   AND NOT EXISTS (SELECT 1 FROM catalog_items WHERE name = 'Black Iron Crown of Pwnage');

INSERT INTO catalog_items (name, category, creator_id, tickets, bucks, on_sale)
SELECT 'Helmet', 'Hats', (SELECT id FROM users ORDER BY id ASC LIMIT 1), 500, 93, 1
 WHERE EXISTS (SELECT 1 FROM users)
   AND NOT EXISTS (SELECT 1 FROM catalog_items WHERE name = 'Helmet');

-- Descriptions and artwork. The image is a path under public/ - the files sit in
-- public/img/ - and an item with an empty image is drawn as its colour swatch,
-- so an item without art never shows a broken picture.
INSERT INTO catalog_item_details (item_id, description, image)
SELECT i.id, 'Ad astra per aspera', '/img/Astronaut_Helmet.jpg'
  FROM catalog_items i
 WHERE i.name = 'Astronaut Helmet'
   AND NOT EXISTS (SELECT 1 FROM catalog_item_details d WHERE d.item_id = i.id);

INSERT INTO catalog_item_details (item_id, description, image)
SELECT i.id, '', '/img/Black_Iron_Crown_of_Pwnage.jpg'
  FROM catalog_items i
 WHERE i.name = 'Black Iron Crown of Pwnage'
   AND NOT EXISTS (SELECT 1 FROM catalog_item_details d WHERE d.item_id = i.id);

INSERT INTO catalog_item_details (item_id, description, image)
SELECT i.id, '', '/img/Helmet.jpg'
  FROM catalog_items i
 WHERE i.name = 'Helmet'
   AND NOT EXISTS (SELECT 1 FROM catalog_item_details d WHERE d.item_id = i.id);

-- The artwork arrived after these rows already existed on the live database, and
-- the inserts above only run when a detail row is missing. This fills in a path
-- that is still blank, and leaves one that is already set alone, so an item whose
-- art is deliberately removed stays removed.
UPDATE catalog_item_details
   SET image = '/img/Astronaut_Helmet.jpg'
 WHERE image = ''
   AND item_id IN (SELECT id FROM catalog_items WHERE name = 'Astronaut Helmet');

UPDATE catalog_item_details
   SET image = '/img/Black_Iron_Crown_of_Pwnage.jpg'
 WHERE image = ''
   AND item_id IN (SELECT id FROM catalog_items WHERE name = 'Black Iron Crown of Pwnage');

UPDATE catalog_item_details
   SET image = '/img/Helmet.jpg'
 WHERE image = ''
   AND item_id IN (SELECT id FROM catalog_items WHERE name = 'Helmet');
