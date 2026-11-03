/**
 * Staff currency adjustments.
 *
 * Money only moves through the ledger: the balance change and the entry that
 * describes it are written together, and the entry reads balance_after from the
 * row itself, so a balance can never disagree with its own record.
 *
 * Taking currency away is guarded (`WHERE tickets >= ?`) rather than read-check-
 * write, so two takes at once cannot leave an account overdrawn.
 *
 * The reason is required and is written into both the ledger and the audit log:
 * "why did this account gain 5,000 Tickets" is the question the ledger exists to
 * answer.
 */

/** The two balances, and the column each one lives in. */
const CURRENCIES = ['tickets', 'bucks'];

/** One grant cannot be smaller than this, or larger than MAX_AMOUNT. */
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000000;

/** Reasons are stored on the ledger row, so they are kept to a line. */
const REASON_MIN = 3;
const REASON_MAX = 200;

function isoNow() {
  return new Date().toISOString();
}

/** Both balances for one account, as numbers. */
async function balances(db, userId) {
  const row = await db
    .prepare('SELECT tickets, bucks FROM users WHERE id = ?')
    .bind(Number(userId) || 0)
    .first();

  if (!row) return null;

  return {
    tickets: Number(row.tickets) || 0,
    bucks: Number(row.bucks) || 0,
  };
}

/** Wording for the panel: "Tickets", "Bucks". */
function label(currency) {
  return currency === 'bucks' ? 'Bucks' : currency === 'tickets' ? 'Tickets' : currency;
}

/**
 * Add or take currency on one account.
 *
 * Codes: currency (not a currency), amount (not a whole number in range),
 * noreason (missing or too short), nobody (no such account), funds (not enough
 * to take), currency_granted, currency_taken.
 */
async function adjust(db, options) {
  const opts = options || {};
  const currency = String(opts.currency || '');
  const amount = Number(opts.amount);
  const reason = String(opts.reason || '').trim().slice(0, REASON_MAX);
  const take = Boolean(opts.take);

  if (!CURRENCIES.includes(currency)) return { ok: false, code: 'currency' };

  if (!Number.isInteger(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return { ok: false, code: 'amount' };
  }

  if (reason.length < REASON_MIN) return { ok: false, code: 'noreason' };

  const target = await db
    .prepare('SELECT id, username FROM users WHERE id = ?')
    .bind(Number(opts.userId) || 0)
    .first();

  if (!target) return { ok: false, code: 'nobody' };

  if (take) {
    const cut = await db
      .prepare(
        `UPDATE users SET ${currency} = ${currency} - ? WHERE id = ? AND ${currency} >= ?`
      )
      .bind(amount, target.id, amount)
      .run();

    if (!cut || !cut.meta || Number(cut.meta.changes) === 0) {
      return { ok: false, code: 'funds' };
    }
  } else {
    await db
      .prepare(`UPDATE users SET ${currency} = ${currency} + ? WHERE id = ?`)
      .bind(amount, target.id)
      .run();
  }

  const delta = take ? -amount : amount;

  // balance_after is read from the row in the same statement that writes the
  // entry, so the two cannot drift apart.
  await db
    .prepare(
      `INSERT INTO ledger (user_id, currency, delta, balance_after, reason, ref, created_at)
       SELECT id, ?, ?, ${currency}, ?, ?, ? FROM users WHERE id = ?`
    )
    .bind(currency, delta, reason, `staff:${opts.actorId || 0}`, isoNow(), target.id)
    .run();

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      opts.actorId || null,
      target.id,
      take ? 'currency_taken' : 'currency_granted',
      `${delta > 0 ? '+' : ''}${delta} ${label(currency)} - ${reason}`,
      isoNow()
    )
    .run();

  const after = await balances(db, target.id);

  return {
    ok: true,
    code: take ? 'currency_taken' : 'currency_granted',
    username: target.username,
    currency,
    delta,
    balance: after ? after[currency] : 0,
  };
}

module.exports = {
  CURRENCIES,
  MAX_AMOUNT,
  MIN_AMOUNT,
  REASON_MAX,
  adjust,
  balances,
  label,
};
