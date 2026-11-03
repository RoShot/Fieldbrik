/**
 * The referral grant.
 *
 * One account refers another, once. The reward is 15 Bucks written through the
 * ledger (never a bare balance update), a badge if the seeded badge table has
 * one, and an audit entry. The cap is per referring account and lives here so
 * the form and the server agree on the same number.
 */

/** Ten per account, as specified. */
const CAP = 10;

/** What one referral is worth, in Bucks. */
const REWARD_BUCKS = 15;

function formatDate(iso) {
  const text = String(iso || '');
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${months[month - 1]} ${year}`;
}

async function count(db, userId) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM referrals WHERE referrer_id = ?')
    .bind(userId)
    .first();

  return row ? Number(row.n) || 0 : 0;
}

async function list(db, userId) {
  const rows = await db
    .prepare(
      `SELECT r.id, r.reward_bucks, r.created_at,
              u.username AS referred,
              g.username AS granted_by
         FROM referrals r
         LEFT JOIN users u ON u.id = r.referred_id
         LEFT JOIN users g ON g.id = r.granted_by
        WHERE r.referrer_id = ?
        ORDER BY r.id DESC
        LIMIT 20`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map((row) => ({
    id: row.id,
    referred: row.referred || '(deleted account)',
    reward: Number(row.reward_bucks) || 0,
    by: row.granted_by || 'staff',
    when: formatDate(row.created_at),
  }));
}

/** Resolves an account id or a username, so the form can take either. */
async function resolveAccount(db, value) {
  const text = String(value || '').trim();
  if (!text) return null;

  const row = /^\d+$/.test(text)
    ? await db.prepare('SELECT id, username FROM users WHERE id = ?').bind(Number(text)).first()
    : await db
        .prepare('SELECT id, username FROM users WHERE username_lower = ?')
        .bind(text.toLowerCase())
        .first();

  return row ? { id: row.id, username: row.username } : null;
}

async function grant(db, options) {
  const opts = options || {};
  const now = opts.now || new Date().toISOString();

  if (String(opts.referrerId) === String(opts.referredId)) {
    return { ok: false, code: 'self_referral' };
  }

  const referred = await db
    .prepare('SELECT id FROM users WHERE id = ?')
    .bind(Number(opts.referredId) || 0)
    .first();

  if (!referred) return { ok: false, code: 'nobody' };

  const already = await db
    .prepare('SELECT id FROM referrals WHERE referred_id = ?')
    .bind(referred.id)
    .first();

  if (already) return { ok: false, code: 'already' };

  const used = await count(db, opts.referrerId);
  if (used >= CAP) return { ok: false, code: 'atcap' };

  const inserted = await db
    .prepare(
      `INSERT INTO referrals (referrer_id, referred_id, granted_by, reward_bucks, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(opts.referrerId, referred.id, opts.actor.id, REWARD_BUCKS, now)
    .run();

  // The balance and the ledger entry move together: the ledger is the record of
  // truth, so a balance change without an entry is the one thing not allowed.
  await db
    .prepare('UPDATE users SET bucks = bucks + ? WHERE id = ?')
    .bind(REWARD_BUCKS, opts.referrerId)
    .run();

  const balance = await db.prepare('SELECT bucks FROM users WHERE id = ?').bind(opts.referrerId).first();

  await db
    .prepare(
      `INSERT INTO ledger (user_id, currency, delta, balance_after, reason, ref, created_at)
       VALUES (?, 'bucks', ?, ?, 'Referral reward', ?, ?)`
    )
    .bind(
      opts.referrerId,
      REWARD_BUCKS,
      balance ? Number(balance.bucks) || 0 : REWARD_BUCKS,
      `referral:${inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0}`,
      now
    )
    .run();

  // Only if the badge exists: seeding is what defines badges, and a missing key
  // would otherwise turn a successful referral into a foreign-key failure.
  const badge = await db.prepare("SELECT key FROM badges WHERE key = 'referral'").first();

  if (badge) {
    await db
      .prepare(
        `INSERT INTO user_badges (user_id, badge_key, granted_by)
         VALUES (?, 'referral', ?)
         ON CONFLICT (user_id, badge_key) DO NOTHING`
      )
      .bind(opts.referrerId, opts.actor.id)
      .run();
  }

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'referral_granted', ?, ?)`
    )
    .bind(opts.actor.id, opts.referrerId, `referred account ${referred.id}`, now)
    .run();

  return {
    ok: true,
    code: 'referral_granted',
    used: used + 1,
    balance: balance ? Number(balance.bucks) || 0 : 0,
  };
}

module.exports = { CAP, REWARD_BUCKS, count, grant, list, resolveAccount };
