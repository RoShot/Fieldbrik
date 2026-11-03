/**
 * What a member is told.
 *
 * Two things live here because they are the same idea from two directions: a
 * reminder is a message staff write to an account, and a warning is a moderation
 * record the account has to be able to see. Both were invisible before this -
 * the inbox still rendered fixture rows, and a warning only existed inside the
 * admin panel, which is not much use to the person it was issued against.
 *
 * A warning blocks nothing, so nothing here is consulted by the request gate.
 * This file is display only.
 */

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** The same short date the rest of the site uses, so the inbox reads like it. */
function formatDate(iso) {
  const text = String(iso || '');
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** A stored body is one text blob; the message page draws paragraphs. */
function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function shape(row) {
  return {
    id: row.id,
    from: row.sender || 'FieldBrik',
    to: row.recipient || '',
    subject: row.subject || '(no subject)',
    date: formatDate(row.created_at),
    read: Boolean(row.read_at),
    body: paragraphs(row.body),
  };
}

const MESSAGE_COLUMNS = `
  m.id, m.subject, m.body, m.created_at, m.read_at,
  s.username AS sender, r.username AS recipient
    FROM messages m
    LEFT JOIN users s ON s.id = m.from_id
    LEFT JOIN users r ON r.id = m.to_id`;

/**
 * This member's inbox, newest first.
 *
 * Scoped by to_id in the query itself, not filtered afterwards: a page that
 * fetched everything and dropped the rest would still be one bug away from
 * showing somebody else's mail.
 */
async function inbox(db, userId) {
  const rows = await db
    .prepare(
      `SELECT ${MESSAGE_COLUMNS}
        WHERE m.to_id = ? AND m.to_deleted_at IS NULL
        ORDER BY m.id DESC
        LIMIT 50`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map(shape);
}

/**
 * One message, marked read on the way out.
 *
 * Returns null when the id belongs to somebody else, so the caller can answer
 * 404 without saying whether it exists.
 */
async function openMessage(db, userId, id) {
  const row = await db
    .prepare(`SELECT ${MESSAGE_COLUMNS} WHERE m.id = ? AND m.to_id = ? AND m.to_deleted_at IS NULL`)
    .bind(id, userId)
    .first();

  if (!row) return null;

  if (!row.read_at) {
    await db
      .prepare('UPDATE messages SET read_at = ? WHERE id = ? AND read_at IS NULL')
      .bind(new Date().toISOString(), id)
      .run();
    row.read_at = new Date().toISOString();
  }

  return shape(row);
}

/**
 * Warnings this member has not dismissed, newest first.
 *
 * A lifted warning drops off the page but stays on the record. So does a
 * dismissed one: dismissing is "I have read this", not "this did not happen".
 */
async function warnings(db, userId) {
  const rows = await db
    .prepare(
      `SELECT r.id, r.reason, r.issued_at, a.username AS actor
         FROM restrictions r
         LEFT JOIN warning_acknowledgements w ON w.restriction_id = r.id
         LEFT JOIN users a ON a.id = r.issued_by
        WHERE r.user_id = ?
          AND r.kind = 'warning'
          AND r.lifted_at IS NULL
          AND w.restriction_id IS NULL
        ORDER BY r.id DESC
        LIMIT 10`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map((row) => ({
    id: row.id,
    reason: row.reason,
    actor: row.actor || 'FieldBrik staff',
    when: formatDate(row.issued_at),
  }));
}

/**
 * Marks one of this member's warnings as read.
 *
 * Both the warning and the member are in the WHERE clause: an id alone would let
 * anyone dismiss anyone's warning by guessing a number.
 */
async function acknowledgeWarning(db, userId, id) {
  const row = await db
    .prepare(
      `SELECT id FROM restrictions
        WHERE id = ? AND user_id = ? AND kind = 'warning' AND lifted_at IS NULL`
    )
    .bind(id, userId)
    .first();

  if (!row) return false;

  await db
    .prepare(
      `INSERT INTO warning_acknowledgements (restriction_id, user_id)
       VALUES (?, ?)
       ON CONFLICT (restriction_id) DO NOTHING`
    )
    .bind(id, userId)
    .run();

  return true;
}

module.exports = {
  acknowledgeWarning,
  formatDate,
  inbox,
  openMessage,
  warnings,
};
