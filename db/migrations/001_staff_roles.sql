-- 001 - the staff role ladder.
--
-- Applied by the deploy workflow after db/schema.sql and before db/seed.sql.
-- Every statement here is safe to run again: the deploy re-applies migrations on
-- every push, so a migration that is not idempotent would need a tracking table
-- first. Keep new ones to CREATE ... IF NOT EXISTS and upserts.
--
-- Stored as a table rather than a CHECK on users.role so the ladder can change
-- without rebuilding the accounts table, and so an ordinary member simply has no
-- row here instead of a fake "user" rank.

CREATE TABLE IF NOT EXISTS roles (
  key         TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  rank        INTEGER NOT NULL UNIQUE CHECK (rank BETWEEN 0 AND 255),
  description TEXT    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id    INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  role_key   TEXT    NOT NULL REFERENCES roles (key),
  granted_by INTEGER REFERENCES users (id),
  granted_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles (role_key);

INSERT INTO roles (key, name, rank, description) VALUES
  ('intern',               'Intern',                50, 'Staff trainee.'),
  ('developer',            'Developer',            100, 'Platform development.'),
  ('support_rep',          'Support Rep',          150, 'Customer support.'),
  ('support_admin',        'Support Admin',        160, 'Advanced account support.'),
  ('image_moderator',      'Image Moderator',      170, 'Asset and image approval.'),
  ('forum_moderator',      'Forum Moderator',      180, 'Forum moderation.'),
  ('moderator',            'Moderator',            190, 'General moderation.'),
  ('senior_moderator',     'Senior Moderator',     200, 'Experienced moderation staff.'),
  ('super_moderator',      'Super Moderator',      210, 'Oversees the moderators.'),
  ('junior_administrator', 'Junior Administrator', 220, 'Trial administrator.'),
  ('senior_administrator', 'Senior Administrator', 230, 'Experienced administrator.'),
  ('administrator',        'Administrator',        240, 'Administers the platform.'),
  ('super_administrator',  'Super Administrator',  250, 'Subordinate to Root only.'),
  ('root',                 'Root',                 255, 'Founder account.')
ON CONFLICT (key) DO UPDATE SET
  name        = excluded.name,
  rank        = excluded.rank,
  description = excluded.description;

-- Carry across the four role values users.role held before the ladder existed.
-- DO NOTHING, so a role changed from the panel is never reset by a deploy.
INSERT INTO user_roles (user_id, role_key)
SELECT id,
       CASE role
         WHEN 'support_staff'       THEN 'support_rep'
         WHEN 'moderator'           THEN 'moderator'
         WHEN 'administrator'       THEN 'administrator'
         WHEN 'super_administrator' THEN 'super_administrator'
       END
  FROM users
 WHERE role IN ('support_staff', 'moderator', 'administrator', 'super_administrator')
ON CONFLICT (user_id) DO NOTHING;

-- The first Root, as agreed with the operator. DO NOTHING rather than an update:
-- once the row exists the panel owns it, and a deploy must not undo a demotion.
INSERT INTO user_roles (user_id, role_key)
SELECT id, 'root'
  FROM users
 WHERE username_lower = 'brickbuilder' AND closed_at IS NULL
ON CONFLICT (user_id) DO NOTHING;
