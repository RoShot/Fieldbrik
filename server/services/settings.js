/**
 * Editable site settings.
 *
 * One key/value table, read through here so a missing row falls back to a
 * default written down in code rather than to zero. A rate of 0 because a row
 * was never created is the kind of bug that looks like a working feature, and
 * this avoids it by making the default part of the code that reads the value.
 *
 * Writes are validated by the caller and recorded in the audit log there, not
 * here: this service only knows how to store a number.
 */

/** Defaults for every key the site reads. Changing one here is a code change. */
const DEFAULTS = {
  'earn.daily.tickets': 100,
  'earn.daily.tickets.carpenters_club': 150,
  'earn.daily.tickets.carpenters_club_senior': 300,
  'earn.daily.tickets.outrageous_carpenters_club': 500,
  'earn.daily.bucks.outrageous_carpenters_club': 25,
  'earn.visits.block': 10,
  'earn.visits.tickets': 500,
};

/** Keys the rates page may write, in the order it draws them. */
const RATE_KEYS = Object.keys(DEFAULTS);

/** Caps, so a typo cannot hand out a million Tickets a day. */
const MIN_RATE = 0;
const MAX_RATE = 1000000;

/** Whether a key is one this module knows how to read. */
function known(key) {
  return Object.prototype.hasOwnProperty.call(DEFAULTS, key);
}

/**
 * Every setting, with defaults filled in.
 *
 * One query for the whole table: this is read on most page loads by the earnings
 * service, so it must not be a query per key.
 */
async function all(db) {
  const values = { ...DEFAULTS };

  if (!db) return values;

  const rows = await db.prepare('SELECT key, value FROM settings').all();

  (rows.results || []).forEach((row) => {
    if (!known(row.key)) return;
    const number = Number(row.value);
    if (Number.isFinite(number)) values[row.key] = number;
  });

  return values;
}

/** One number, with its default. */
async function number(db, key) {
  const values = await all(db);
  return known(key) ? values[key] : 0;
}

/**
 * Writes one setting.
 *
 * Refuses an unknown key and a value that is not a whole number in range, so a
 * wrong name in a form cannot silently create a setting nothing reads.
 */
async function write(db, key, rawValue, actorId) {
  if (!known(key)) return { ok: false, code: 'key' };

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value < MIN_RATE || value > MAX_RATE) {
    return { ok: false, code: 'value' };
  }

  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at, updated_by)
       VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?)
       ON CONFLICT (key) DO UPDATE SET
         value      = excluded.value,
         updated_at = excluded.updated_at,
         updated_by = excluded.updated_by`
    )
    .bind(key, String(value), actorId || null)
    .run();

  return { ok: true, value };
}

module.exports = { DEFAULTS, MAX_RATE, MIN_RATE, RATE_KEYS, all, known, number, write };
