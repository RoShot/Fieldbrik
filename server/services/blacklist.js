/**
 * The email blacklist.
 *
 * A poisoned account's address lands here, and staff can add or remove one by
 * hand. The check itself happens in the sign-in route, before an account is
 * created, so a blacklisted address never leaves a row behind.
 */

function formatDate(iso) {
  const text = String(iso || '');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${months[month - 1]} ${year}`;
}

/** Deliberately loose: enough to catch a typo, not enough to reject a valid one. */
function looksLikeEmail(value) {
  const text = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) && text.length <= 254;
}

async function list(db) {
  const rows = await db
    .prepare(
      `SELECT b.email_lower, b.reason, b.added_at, u.username AS added_by
         FROM blacklisted_emails b
         LEFT JOIN users u ON u.id = b.added_by
        ORDER BY b.added_at DESC
        LIMIT 200`
    )
    .all();

  return (rows.results || []).map((row) => ({
    email: row.email_lower,
    reason: row.reason || '',
    by: row.added_by || 'staff',
    when: formatDate(row.added_at),
  }));
}

async function add(db, options) {
  const opts = options || {};
  const email = String(opts.email || '').trim().toLowerCase();

  if (!looksLikeEmail(email)) return { ok: false, code: 'bademail' };

  const now = opts.now || new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO blacklisted_emails (email_lower, reason, added_by, added_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (email_lower) DO UPDATE SET
         reason   = excluded.reason,
         added_by = excluded.added_by,
         added_at = excluded.added_at`
    )
    .bind(email, String(opts.reason || '').slice(0, 300), opts.actor.id, now)
    .run();

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, NULL, 'email_blacklisted', ?, ?)`
    )
    .bind(opts.actor.id, email, now)
    .run();

  return { ok: true, code: 'blacklist_added' };
}

async function remove(db, options) {
  const opts = options || {};
  const email = String(opts.email || '').trim().toLowerCase();
  const now = opts.now || new Date().toISOString();

  const row = await db
    .prepare('SELECT email_lower FROM blacklisted_emails WHERE email_lower = ?')
    .bind(email)
    .first();

  if (!row) return { ok: false, code: 'nobreaklist' };

  await db.prepare('DELETE FROM blacklisted_emails WHERE email_lower = ?').bind(email).run();

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, NULL, 'email_unblacklisted', ?, ?)`
    )
    .bind(opts.actor.id, email, now)
    .run();

  return { ok: true, code: 'blacklist_removed' };
}

module.exports = { add, list, looksLikeEmail, remove };
