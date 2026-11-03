/**
 * Badges: which ones have artwork, how they are read, and how staff grant them.
 *
 * The database holds the badge itself - key, name, description, colour - and
 * this file holds the two things the database cannot know:
 *
 *   ART          which badge keys have a drawing
 *   ROLE_BADGES  which badge a staff role earns
 *
 * The art list is explicit rather than `/img/<key>.png`, so a badge whose art
 * has not been uploaded keeps its coloured square instead of a broken image.
 */

const ART = {
  super_administrator: '/img/superadmin.png',
  administrator: '/img/administrator.png',
  image_moderator: '/img/imagemod.png',
  forum_moderator: '/img/formmod.png',
  carpenters_club: '/img/ccb.png',
  carpenters_club_senior: '/img/ccs.png',
  outrageous_carpenters_club: '/img/occ.png',
  official_model_maker: '/img/officialmodelmaker.png',
  ambassador: '/img/ambassador.png',
  one_year: '/img/1year.png',
  friends_20: '/img/20friends.png',
  brikker: '/img/brikker.png',
  briksmith: '/img/briksmith.png',
  // The invite badge is stored under the key the referral grant already writes.
  referral: '/img/inviter.png',
};

/**
 * The badge a role carries.
 *
 * Several roles share one badge on purpose: the ladder has three moderator
 * grades and three administrator grades, and the art distinguishes moderator
 * from administrator rather than drawing six near-identical pictures. Root
 * carries the Super Administrator badge, which is what the operator described
 * that artwork as covering.
 */
const ROLE_BADGES = {
  support_rep: 'support_staff',
  support_admin: 'support_staff',
  image_moderator: 'image_moderator',
  forum_moderator: 'forum_moderator',
  moderator: 'moderator',
  senior_moderator: 'moderator',
  super_moderator: 'moderator',
  junior_administrator: 'administrator',
  senior_administrator: 'administrator',
  administrator: 'administrator',
  super_administrator: 'super_administrator',
  root: 'super_administrator',
};

/** Every badge a role can account for. Used when a role goes away. */
const ROLE_BADGE_KEYS = ['support_staff', 'image_moderator', 'forum_moderator', 'moderator', 'administrator', 'super_administrator'];

/** The drawing for a badge key, or '' when it has none yet. */
function artFor(key) {
  return ART[String(key || '')] || '';
}

/** The badge a role earns, or '' for a role that carries none. */
function badgeForRole(roleKey) {
  return ROLE_BADGES[String(roleKey || '')] || '';
}

/** 3 nov 2026, the way the panel writes dates. */
function formatDate(iso) {
  const text = String(iso || '');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${months[month - 1]} ${year}`;
}

/** Every defined badge, with how many accounts hold it. */
async function catalogue(db) {
  const result = await db
    .prepare(
      `SELECT b.key, b.name, b.description, b.color,
              (SELECT COUNT(*) FROM user_badges ub WHERE ub.badge_key = b.key) AS holders
         FROM badges b
        ORDER BY b.name ASC`
    )
    .all();

  return (result.results || []).map((row) => ({
    key: row.key,
    name: row.name,
    description: row.description,
    color: row.color,
    art: artFor(row.key),
    holders: Number(row.holders) || 0,
  }));
}

/** The badges one account holds, oldest first. */
async function held(db, userId) {
  const result = await db
    .prepare(
      `SELECT b.key, b.name, b.description, b.color, ub.granted_at, g.username AS granted_by
         FROM user_badges ub
         JOIN badges b ON b.key = ub.badge_key
         LEFT JOIN users g ON g.id = ub.granted_by
        WHERE ub.user_id = ?
        ORDER BY ub.granted_at ASC, b.name ASC`
    )
    .bind(userId)
    .all();

  return (result.results || []).map((row) => ({
    key: row.key,
    name: row.name,
    description: row.description,
    color: row.color,
    art: artFor(row.key),
    when: formatDate(row.granted_at),
    by: row.granted_by || 'system',
  }));
}

/**
 * Grant one badge.
 *
 * A badge the catalogue does not define is refused rather than inserted, because
 * user_badges has a foreign key and a typo should read as a refusal, not a crash.
 */
async function grant(db, options) {
  const opts = options || {};
  const key = String(opts.key || '').trim();

  const badge = await db.prepare('SELECT key, name FROM badges WHERE key = ?').bind(key).first();
  if (!badge) return { ok: false, code: 'badge' };

  const existing = await db
    .prepare('SELECT 1 AS n FROM user_badges WHERE user_id = ? AND badge_key = ?')
    .bind(opts.userId, badge.key)
    .first();

  if (existing) return { ok: false, code: 'held' };

  await db
    .prepare('INSERT INTO user_badges (user_id, badge_key, granted_by) VALUES (?, ?, ?)')
    .bind(opts.userId, badge.key, opts.actor ? opts.actor.id : null)
    .run();

  const note = String(opts.note || '').trim().slice(0, 300);

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'badge_granted', ?, ?)`
    )
    .bind(opts.actor ? opts.actor.id : null, opts.userId, note ? `${badge.name} - ${note}` : badge.name, opts.now || new Date().toISOString())
    .run();

  return { ok: true, code: 'badge_granted', name: badge.name };
}

/** Take one badge away again. The log keeps the fact that it was held. */
async function revoke(db, options) {
  const opts = options || {};
  const key = String(opts.key || '').trim();

  const badge = await db.prepare('SELECT key, name FROM badges WHERE key = ?').bind(key).first();
  if (!badge) return { ok: false, code: 'badge' };

  const existing = await db
    .prepare('SELECT 1 AS n FROM user_badges WHERE user_id = ? AND badge_key = ?')
    .bind(opts.userId, badge.key)
    .first();

  if (!existing) return { ok: false, code: 'notheld' };

  await db
    .prepare('DELETE FROM user_badges WHERE user_id = ? AND badge_key = ?')
    .bind(opts.userId, badge.key)
    .run();

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'badge_revoked', ?, ?)`
    )
    .bind(opts.actor ? opts.actor.id : null, opts.userId, badge.name, opts.now || new Date().toISOString())
    .run();

  return { ok: true, code: 'badge_revoked', name: badge.name };
}

/**
 * Bring an account's role badges in line with the role it now holds.
 *
 * Called from the role change, so a promotion shows the badge immediately and a
 * demotion takes it back. Only the role badges are touched: a badge a member
 * earned - club tier, knockout, invite - is never removed here, which is the
 * difference between "this came with the job" and "this was earned".
 */
async function syncRoleBadge(db, options) {
  const opts = options || {};
  const wanted = badgeForRole(opts.roleKey);

  const stale = ROLE_BADGE_KEYS.filter((key) => key !== wanted);

  if (stale.length > 0) {
    const placeholders = stale.map(() => '?').join(', ');
    await db
      .prepare(`DELETE FROM user_badges WHERE user_id = ? AND badge_key IN (${placeholders})`)
      .bind(opts.userId, ...stale)
      .run();
  }

  if (!wanted) return;

  const exists = await db.prepare('SELECT key FROM badges WHERE key = ?').bind(wanted).first();
  if (!exists) return;

  await db
    .prepare(
      `INSERT INTO user_badges (user_id, badge_key, granted_by)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id, badge_key) DO NOTHING`
    )
    .bind(opts.userId, wanted, opts.actorId || null)
    .run();
}

module.exports = {
  ART,
  ROLE_BADGES,
  ROLE_BADGE_KEYS,
  artFor,
  badgeForRole,
  catalogue,
  grant,
  held,
  revoke,
  syncRoleBadge,
};
