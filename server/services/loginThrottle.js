/**
 * Sign-in rate limiting.
 *
 * One form registers or signs in, so the limit belongs on the log-in side: a
 * name that keeps getting the password wrong is refused for a while, and so is
 * a client failing against many names. Failures are written to D1 rather than
 * kept in memory, because an in-memory counter gives every Worker isolate its
 * own allowance - which is the same as no limit at all.
 *
 * What this does not do is stop an attack spread over many addresses. It makes
 * guessing one account's password slow, which is the realistic threat for a
 * shared-name form with an eight character minimum.
 *
 * Rows are swept on the same write that adds one, so the table stays small and
 * there is no separate cleanup job to forget about.
 */

const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_NAME = 8;
const MAX_FAILURES_PER_ADDRESS = 20;
const KEEP_MINUTES = 24 * 60;

function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

function normalise(username) {
  return String(username || '').trim().toLowerCase();
}

/** The column is chosen from a fixed list by the caller, never from input. */
async function countSince(db, column, value, since) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM login_attempts WHERE ${column} = ? AND attempted_at > ?`)
    .bind(value, since)
    .first();

  return row ? Number(row.n) : 0;
}

/**
 * Null when the attempt may proceed, otherwise the reason it may not.
 *
 * Called before the password is checked, so a locked name costs nothing to
 * refuse and no amount of further guessing gets past it.
 */
async function check(db, options = {}) {
  const name = normalise(options.username);
  const address = String(options.ip || '').trim();
  const since = minutesAgo(WINDOW_MINUTES);

  if (name && (await countSince(db, 'username_lower', name, since)) >= MAX_FAILURES_PER_NAME) {
    return { reason: 'name', minutes: WINDOW_MINUTES };
  }

  if (address && (await countSince(db, 'ip', address, since)) >= MAX_FAILURES_PER_ADDRESS) {
    return { reason: 'address', minutes: WINDOW_MINUTES };
  }

  return null;
}

async function record(db, options = {}) {
  const name = normalise(options.username);
  const address = String(options.ip || '').trim();

  if (!name && !address) return;

  await db
    .prepare('INSERT INTO login_attempts (username_lower, ip) VALUES (?, ?)')
    .bind(name, address)
    .run();

  await db.prepare('DELETE FROM login_attempts WHERE attempted_at < ?').bind(minutesAgo(KEEP_MINUTES)).run();
}

/**
 * A correct password clears that name's failures, so somebody who mistyped a few
 * times is not left locked out once they get it right.
 */
async function clear(db, options = {}) {
  const name = normalise(options.username);
  if (!name) return;

  await db.prepare('DELETE FROM login_attempts WHERE username_lower = ?').bind(name).run();
}

module.exports = {
  KEEP_MINUTES,
  MAX_FAILURES_PER_ADDRESS,
  MAX_FAILURES_PER_NAME,
  WINDOW_MINUTES,
  check,
  clear,
  record,
};
