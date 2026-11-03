/**
 * Carpenters Club memberships, as the panel sees them.
 *
 * Payment is not live, so nothing here invents a charge. A staff grant writes a
 * membership with amount 0 and a separate grant row naming the staff member and
 * their note, which is the honest version of "this was given, not bought".
 */

const site = require('../config/site');

/**
 * Months added for each term.
 *
 * quarterly is six months, because that is what the Carpenters Club page tells
 * members ("Quarterly - 6 months"); the panel must expire on the same date the
 * price list implies, not on a tidier three.
 */
const TERM_MONTHS = { monthly: 1, quarterly: 6, yearly: 12 };

function tiers() {
  return site.carpentersClub.tiers;
}

function tierName(key) {
  const tier = tiers().find((entry) => entry.key === key);
  return tier ? tier.name : key;
}

function termName(key) {
  const term = site.carpentersClub.terms.find((entry) => entry.key === key);
  return term ? term.name : key;
}

/** Adds whole months, clamping the day so 31 Jan + 1 month is not 3 March. */
function addMonths(iso, months) {
  const date = new Date(iso);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString();
}

function formatDate(iso) {
  const text = String(iso || '');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${months[month - 1]} ${year}`;
}

async function list(db, userId) {
  const rows = await db
    .prepare(
      `SELECT m.id, m.tier, m.term, m.amount_cents, m.currency,
              m.started_at, m.expires_at, m.cancelled_at,
              g.note, u.username AS granted_by
         FROM memberships m
         LEFT JOIN membership_grants g ON g.membership_id = m.id
         LEFT JOIN users u ON u.id = g.granted_by
        WHERE m.user_id = ?
        ORDER BY m.id DESC
        LIMIT 20`
    )
    .bind(userId)
    .all();

  const now = new Date().toISOString();

  return (rows.results || []).map((row) => ({
    id: row.id,
    tier: row.tier,
    tierName: tierName(row.tier),
    term: row.term,
    termName: termName(row.term),
    started: formatDate(row.started_at),
    expires: row.expires_at ? formatDate(row.expires_at) : 'never',
    cancelled: row.cancelled_at ? formatDate(row.cancelled_at) : '',
    grantedBy: row.granted_by || 'staff',
    note: row.note || '',
    active:
      !row.cancelled_at && (!row.expires_at || String(row.expires_at) > now),
  }));
}

/** The membership that is running now, or null. */
async function activeFor(db, userId) {
  const rows = await list(db, userId);
  return rows.find((entry) => entry.active) || null;
}

async function grant(db, options) {
  const opts = options || {};
  const now = opts.now || new Date().toISOString();

  const tier = tiers().find((entry) => entry.key === opts.tier);
  if (!tier) return { ok: false, code: 'tier' };

  const term = site.carpentersClub.terms.find((entry) => entry.key === opts.term);
  if (!term) return { ok: false, code: 'term' };

  const expiresAt = TERM_MONTHS[term.key] ? addMonths(now, TERM_MONTHS[term.key]) : null;

  const inserted = await db
    .prepare(
      `INSERT INTO memberships (user_id, tier, term, amount_cents, currency, started_at, expires_at)
       VALUES (?, ?, ?, 0, ?, ?, ?)`
    )
    .bind(opts.userId, tier.key, term.key, site.carpentersClub.currency, now, expiresAt)
    .run();

  const membershipId = inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;

  if (membershipId) {
    await db
      .prepare('INSERT INTO membership_grants (membership_id, granted_by, note) VALUES (?, ?, ?)')
      .bind(membershipId, opts.actor.id, String(opts.note || '').slice(0, 300))
      .run();
  }

  // The tier badge goes with the membership and stays after it ends: a member
  // who held Carpenters Club in 2026 keeps the badge in 2027. Only granted when
  // the badge is defined, so a missing key cannot fail the grant.
  const badge = await db.prepare('SELECT key FROM badges WHERE key = ?').bind(tier.key).first();

  if (badge) {
    await db
      .prepare(
        `INSERT INTO user_badges (user_id, badge_key, granted_by)
         VALUES (?, ?, ?)
         ON CONFLICT (user_id, badge_key) DO NOTHING`
      )
      .bind(opts.userId, tier.key, opts.actor.id)
      .run();
  }

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'club_granted', ?, ?)`
    )
    .bind(opts.actor.id, opts.userId, `${tier.name}, ${term.name}`, now)
    .run();

  return { ok: true, code: 'club_granted', expiresAt };
}

async function end(db, options) {
  const opts = options || {};
  const now = opts.now || new Date().toISOString();

  const row = await db
    .prepare('SELECT id, tier, term, cancelled_at FROM memberships WHERE id = ? AND user_id = ?')
    .bind(Number(opts.membershipId) || 0, opts.userId)
    .first();

  if (!row) return { ok: false, code: 'club' };
  if (row.cancelled_at) return { ok: true, code: 'club_ended' };

  await db
    .prepare('UPDATE memberships SET cancelled_at = ? WHERE id = ?')
    .bind(now, row.id)
    .run();

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'club_ended', ?, ?)`
    )
    .bind(opts.actor.id, opts.userId, `${tierName(row.tier)}, ${termName(row.term)}`, now)
    .run();

  return { ok: true, code: 'club_ended' };
}

module.exports = {
  TERM_MONTHS,
  activeFor,
  addMonths,
  end,
  formatDate,
  grant,
  list,
  termName,
  tierName,
  tiers,
};
