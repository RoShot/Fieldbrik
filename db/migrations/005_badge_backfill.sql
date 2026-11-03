-- Badges that had already been earned before there was anywhere to grant them.
--
-- Idempotent: every insert is INSERT OR IGNORE against the (user_id, badge_key)
-- primary key, so re-running this on every deploy changes nothing after the
-- first time. The join onto badges keeps it safe on a fresh database where the
-- catalogue has not been seeded yet: no badge row means no insert, rather than a
-- foreign key failure.
--
-- The mapping is written as a CASE inside a CTE rather than a UNION ALL of the
-- twelve pairs, because D1's SQLite build rejects a compound SELECT of that
-- shape with "too many terms in compound SELECT". Keep it this way.

-- Role badges, using the same mapping as server/services/badges.js.
WITH mapped AS (
  SELECT ur.user_id,
         CASE ur.role_key
           WHEN 'image_moderator'      THEN 'image_moderator'
           WHEN 'forum_moderator'      THEN 'forum_moderator'
           WHEN 'moderator'            THEN 'administrator'
           WHEN 'senior_moderator'     THEN 'administrator'
           WHEN 'super_moderator'      THEN 'administrator'
           WHEN 'junior_administrator' THEN 'administrator'
           WHEN 'senior_administrator' THEN 'administrator'
           WHEN 'administrator'        THEN 'administrator'
           WHEN 'super_administrator'  THEN 'super_administrator'
           WHEN 'root'                 THEN 'super_administrator'
         END AS badge_key,
         ur.granted_by
    FROM user_roles ur
   WHERE ur.role_key IN (
           'image_moderator', 'forum_moderator',
           'moderator', 'senior_moderator', 'super_moderator',
           'junior_administrator', 'senior_administrator', 'administrator',
           'super_administrator', 'root'
         )
)
INSERT OR IGNORE INTO user_badges (user_id, badge_key, granted_by)
SELECT mapped.user_id, mapped.badge_key, mapped.granted_by
  FROM mapped
  JOIN badges b ON b.key = mapped.badge_key;

-- Carpenters Club tier badges for memberships granted before the grant existed.
INSERT OR IGNORE INTO user_badges (user_id, badge_key, granted_by)
SELECT m.user_id, m.tier, NULL
  FROM memberships m
  JOIN badges b ON b.key = m.tier;
