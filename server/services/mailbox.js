/**
 * Private messages between members.
 *
 * The reading half of this already existed in services/notices.js, because a
 * warning and a message are the same row in the same table. This file is the
 * writing half: sending, the sent box, and deleting.
 *
 * Nothing here issues a DELETE. A message is deleted per side by writing
 * from_deleted_at or to_deleted_at, so removing your copy cannot remove the
 * other person's copy of the same conversation. That is also why the columns
 * exist in the schema rather than a plain delete.
 *
 * Every function is scoped by user id in its own WHERE clause. A route that
 * fetched a page of messages and filtered afterwards would still be one bug away
 * from showing somebody else's mail.
 */

const SUBJECT_MAX = 120;
const BODY_MAX = 5000;
const INBOX_LIMIT = 100;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** The same short date the inbox has always used. */
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

function shape(row, direction) {
  return {
    id: Number(row.id) || 0,
    direction: direction === 'out' ? 'out' : 'in',
    from: row.sender || 'FieldBrik',
    to: row.recipient || '',
    subject: row.subject || '(no subject)',
    rawSubject: row.subject || '',
    date: formatDate(row.created_at),
    // "read" always means the recipient opened it, whichever box is drawing it.
    read: Boolean(row.read_at),
    body: paragraphs(row.body),
  };
}

const COLUMNS = `
  m.id, m.subject, m.body, m.created_at, m.read_at,
  s.username AS sender, r.username AS recipient
    FROM messages m
    LEFT JOIN users s ON s.id = m.from_id
    LEFT JOIN users r ON r.id = m.to_id
`;

/** This member's incoming messages, newest first. */
async function inbox(db, userId) {
  const rows = await db
    .prepare(
      `SELECT ${COLUMNS}
        WHERE m.to_id = ? AND m.to_deleted_at IS NULL
        ORDER BY m.id DESC
        LIMIT ${INBOX_LIMIT}`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map((row) => shape(row, 'in'));
}

/** Messages this member sent, newest first. */
async function sent(db, userId) {
  const rows = await db
    .prepare(
      `SELECT ${COLUMNS}
        WHERE m.from_id = ? AND m.from_deleted_at IS NULL
        ORDER BY m.id DESC
        LIMIT ${INBOX_LIMIT}`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map((row) => shape(row, 'out'));
}

async function sentCount(db, userId) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM messages WHERE from_id = ? AND from_deleted_at IS NULL')
    .bind(userId)
    .first();

  return row ? Number(row.n) || 0 : 0;
}

async function unreadCount(db, userId) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM messages
        WHERE to_id = ? AND to_deleted_at IS NULL AND read_at IS NULL`
    )
    .bind(userId)
    .first();

  return row ? Number(row.n) || 0 : 0;
}

/**
 * One message, from whichever box holds it.
 *
 * Opening an incoming message marks it read; opening one you sent does not,
 * because a sender opening their own copy says nothing about the recipient.
 * Returns null when the id belongs to neither side, so a caller can answer 404
 * without revealing whether the row exists.
 */
async function open(db, userId, id) {
  const numeric = Number(id) || 0;
  if (!numeric) return null;

  const incoming = await db
    .prepare(`SELECT ${COLUMNS} WHERE m.id = ? AND m.to_id = ? AND m.to_deleted_at IS NULL`)
    .bind(numeric, userId)
    .first();

  if (incoming) {
    if (!incoming.read_at) {
      const now = new Date().toISOString();
      await db
        .prepare('UPDATE messages SET read_at = ? WHERE id = ? AND read_at IS NULL')
        .bind(now, numeric)
        .run();
      incoming.read_at = now;
    }

    return shape(incoming, 'in');
  }

  const outgoing = await db
    .prepare(`SELECT ${COLUMNS} WHERE m.id = ? AND m.from_id = ? AND m.from_deleted_at IS NULL`)
    .bind(numeric, userId)
    .first();

  return outgoing ? shape(outgoing, 'out') : null;
}

/**
 * Deletes this member's copy of a message.
 *
 * Returns 'in' or 'out' so the route can send the browser back to the box it came
 * from, and null when the message is not theirs.
 */
async function remove(db, userId, id) {
  const numeric = Number(id) || 0;
  if (!numeric) return null;

  const now = new Date().toISOString();

  const incoming = await db
    .prepare('SELECT id FROM messages WHERE id = ? AND to_id = ?')
    .bind(numeric, userId)
    .first();

  if (incoming) {
    await db
      .prepare('UPDATE messages SET to_deleted_at = ? WHERE id = ? AND to_deleted_at IS NULL')
      .bind(now, numeric)
      .run();
    return 'in';
  }

  const outgoing = await db
    .prepare('SELECT id FROM messages WHERE id = ? AND from_id = ?')
    .bind(numeric, userId)
    .first();

  if (!outgoing) return null;

  await db
    .prepare('UPDATE messages SET from_deleted_at = ? WHERE id = ? AND from_deleted_at IS NULL')
    .bind(now, numeric)
    .run();

  return 'out';
}

/**
 * Sends one message.
 *
 * Codes: no_member, self, blocked, empty, long, subject, refused.
 *
 * The recipient is looked up by lower-cased username on the server, so a form
 * cannot address an account by number, and a closed account cannot be written to.
 * `blocked` is the friendship row in either direction: a member who has blocked
 * somebody should not have to keep receiving their messages.
 */
async function send(db, options) {
  const opts = options || {};
  const fromId = Number(opts.fromId) || 0;

  const toName = String(opts.to || '').trim();
  const subject = String(opts.subject || '').trim();
  const body = String(opts.body || '').trim();

  if (!fromId) return { ok: false, code: 'refused' };
  if (!toName) return { ok: false, code: 'no_member' };
  if (subject.length > SUBJECT_MAX) return { ok: false, code: 'subject' };
  if (!body) return { ok: false, code: 'empty' };
  if (body.length > BODY_MAX) return { ok: false, code: 'long' };

  const recipient = await db
    .prepare('SELECT id FROM users WHERE username_lower = ? AND closed_at IS NULL')
    .bind(toName.toLowerCase())
    .first();

  if (!recipient) return { ok: false, code: 'no_member' };
  if (String(recipient.id) === String(fromId)) return { ok: false, code: 'self' };

  // user_a is always the lower id, so a pair has one row whichever way round the
  // two accounts are.
  const low = Math.min(Number(recipient.id), fromId);
  const high = Math.max(Number(recipient.id), fromId);

  const pair = await db
    .prepare('SELECT status FROM friendships WHERE user_a = ? AND user_b = ?')
    .bind(low, high)
    .first();

  if (pair && pair.status === 'blocked') return { ok: false, code: 'blocked' };

  const inserted = await db
    .prepare('INSERT INTO messages (from_id, to_id, subject, body) VALUES (?, ?, ?, ?)')
    .bind(fromId, recipient.id, subject, body)
    .run();

  const id = inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;
  if (!id) return { ok: false, code: 'refused' };

  return { ok: true, code: 'sent', id };
}

module.exports = {
  BODY_MAX,
  INBOX_LIMIT,
  SUBJECT_MAX,
  formatDate,
  inbox,
  open,
  paragraphs,
  remove,
  send,
  sent,
  sentCount,
  shape,
  unreadCount,
};
