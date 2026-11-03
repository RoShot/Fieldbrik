-- Seed data for FieldBrik 0.3.
--
-- This file contains site structure only: badge definitions and forum sections.
-- It deliberately does not create members, places, items or posts. Those are
-- user data, and inventing them would put fake accounts into a real database.
-- The first real account is created through registration.

-- Badge definitions. The key is stored on user_badges, so these strings must
-- match the role names in users.role and the Carpenters Club tiers.
INSERT INTO badges (key, name, description, color) VALUES
  ('super_administrator', 'Super Administrator', 'Runs the platform.', '#8a2f2f'),
  ('administrator',       'Administrator',       'Administers the platform.', '#a8471f'),
  ('moderator',           'Moderator',           'Keeps the community safe.', '#2f6fb5'),
  ('support_staff',       'Support Staff',       'Helps members with account issues.', '#3f8f5c'),
  ('carpenters_club',     'Carpenters Club',     'Recognised for outstanding builds.', '#a9822f')
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
