-- Seed data for FieldBrik 0.3.
--
-- This file contains site structure only: badge definitions and forum sections.
-- It deliberately does not create members, places, items or posts. Those are
-- user data, and inventing them would put fake accounts into a real database.
-- The first real account is created through registration.

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
