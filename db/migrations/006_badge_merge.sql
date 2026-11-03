-- Two badges retired by the operator.
--
-- Support Staff and Moderator are gone: nobody earns them any more, and
-- moderators wear the Administrator badge instead. Deleting the definition
-- cascades to user_badges, so the grants go with it rather than leaving rows
-- that point at a badge with no name or art.
--
-- Order matters: the delete runs first, then the role badges are rebuilt from
-- the same mapping as server/services/badges.js, which is what gives existing
-- moderators their Administrator badge in place of the one just deleted.
-- Idempotent - every insert is INSERT OR IGNORE, and the delete removes nothing
-- on a second run.

DELETE FROM badges WHERE key IN ('moderator', 'support_staff');

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
