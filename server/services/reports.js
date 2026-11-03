/**
 * Abuse reports.
 *
 * A report is a member saying "look at this", plus a fixed reason. The reason is
 * a key from the list below rather than what was typed, so the queue can be
 * grouped and sorted without guessing at free text, and the words the reporter
 * chose are kept separately in `detail`.
 *
 * Who can see the queue is decided in services/permissions.js like every other
 * staff action; deciding it here as well would be a second opinion that could
 * drift. What this file does decide is which reports may be filed at all:
 *
 *   - never about yourself
 *   - a member report names an open account
 *   - a message report names a message you were sent, so nobody can report a
 *     private message they were not part of
 *   - one open report per reporter per target, so a queue cannot be filled by
 *     pressing the button repeatedly
 */

const REVIEW_RANK = 160;

/** Reasons are keys. The label is what the page draws. */
const REASONS = [
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'sexual', label: 'Sexual content' },
  { key: 'personal', label: 'Sharing personal information' },
  { key: 'scam', label: 'Scam or cheating' },
  { key: 'impersonation', label: 'Pretending to be someone else' },
  { key: 'other', label: 'Something else' },
];

const REASON_KEYS = REASONS.map((reason) => reason.key);

/** Only these two things can be reported today. */
const KINDS = ['member', 'message'];

const DETAIL_MAX = 2000;

const KINDS_LABEL = { member: 'Member', message: 'Message' };

function isoNow() {
  return new Date().toISOString();
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function formatDate(iso) {
  const text = String(iso || '');
  const year = text.slice(0, 4);
  const month = Number(text.slice(5, 7));
  const day = Number(text.slice(8, 10));
  if (!year || !month || !day) return '-';
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function reasonLabel(key) {
  const found = REASONS.find((reason) => reason.key === key);
  return found ? found.label : key;
}

function shape(row) {
  return {
    id: Number(row.id),
    kind: row.kind,
    kindLabel: KINDS_LABEL[row.kind] || row.kind,
    reason: row.reason,
    reasonLabel: reasonLabel(row.reason),
    detail: row.detail || '',
    status: row.status,
    created: formatDate(row.created_at),
    when: String(row.created_at || '').replace('T', ' ').slice(0, 16),
    reporter: row.reporter || 'closed account',
    reporterId: Number(row.reporter_id) || 0,
    target: row.target || 'closed account',
    targetId: Number(row.target_user_id) || 0,
    messageId: row.message_id ? Number(row.message_id) : null,
    messageSubject: row.message_subject || '',
    handler: row.handler || '',
    handled: row.handled_at ? formatDate(row.handled_at) : '',
    note: row.note || '',
  };
}

const COLUMNS = `
  r.id, r.kind, r.reason, r.detail, r.status, r.created_at,
  r.reporter_id, r.target_user_id, r.message_id, r.note, r.handled_at,
  rep.username AS reporter,
  tgt.username AS target,
  m.subject    AS message_subject,
  h.username   AS handler
    FROM reports r
    LEFT JOIN users rep    ON rep.id = r.reporter_id
    LEFT JOIN users tgt    ON tgt.id = r.target_user_id
    LEFT JOIN messages m   ON m.id  = r.message_id
    LEFT JOIN users h      ON h.id  = r.handled_by
`;

/**
 * Files a report.
 *
 * Codes: kind, reason, detail, no_member, self, no_message, already, refused.
 *
 * `messageId` is only read for a message report, and the message must have been
 * addressed to the reporter - the WHERE clause carries that, so a guessed id
 * cannot open somebody else's mail into a report.
 */
async function create(db, options) {
  const opts = options || {};
  const reporterId = Number(opts.reporterId) || 0;

  if (!reporterId) return { ok: false, code: 'refused' };

  const kind = String(opts.kind || '').trim();
  if (!KINDS.includes(kind)) return { ok: false, code: 'kind' };

  const reason = String(opts.reason || '').trim();
  if (!REASON_KEYS.includes(reason)) return { ok: false, code: 'reason' };

  const detail = String(opts.detail || '').trim();
  if (detail.length > DETAIL_MAX) return { ok: false, code: 'detail' };

  let targetUserId = Number(opts.targetUserId) || 0;
  let messageId = null;

  if (kind === 'message') {
    messageId = Number(opts.messageId) || 0;
    if (!messageId) return { ok: false, code: 'no_message' };

    const message = await db
      .prepare('SELECT id, from_id, to_id FROM messages WHERE id = ? AND to_id = ?')
      .bind(messageId, reporterId)
      .first();

    if (!message) return { ok: false, code: 'no_message' };

    // The sender is the account being reported, whatever the form said.
    targetUserId = Number(message.from_id);
  }

  if (!targetUserId) return { ok: false, code: 'no_member' };
  if (String(targetUserId) === String(reporterId)) return { ok: false, code: 'self' };

  const target = await db
    .prepare('SELECT id, closed_at FROM users WHERE id = ?')
    .bind(targetUserId)
    .first();

  if (!target) return { ok: false, code: 'no_member' };

  const existing = await db
    .prepare(
      `SELECT id FROM reports
        WHERE reporter_id = ? AND target_user_id = ? AND kind = ? AND status = 'open'
        LIMIT 1`
    )
    .bind(reporterId, targetUserId, kind)
    .first();

  if (existing) return { ok: false, code: 'already' };

  const inserted = await db
    .prepare(
      `INSERT INTO reports (reporter_id, kind, target_user_id, message_id, reason, detail)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(reporterId, kind, targetUserId, messageId, reason, detail)
    .run();

  const id = inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;
  if (!id) return { ok: false, code: 'refused' };

  return { ok: true, code: 'reported', id };
}

/** The open queue, oldest first, so nothing is starved by newer reports. */
async function queue(db) {
  const rows = await db
    .prepare(`SELECT ${COLUMNS} WHERE r.status = 'open' ORDER BY r.id ASC LIMIT 100`)
    .all();

  return (rows.results || []).map(shape);
}

/** The most recent closed reports, so staff can see what was already answered. */
async function closed(db) {
  const rows = await db
    .prepare(`SELECT ${COLUMNS} WHERE r.status != 'open' ORDER BY r.id DESC LIMIT 30`)
    .all();

  return (rows.results || []).map(shape);
}

async function openCount(db) {
  const row = await db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'").first();
  return row ? Number(row.n) || 0 : 0;
}

/** Reports this member filed, newest first, with what happened to each. */
async function mine(db, userId) {
  const rows = await db
    .prepare(`SELECT ${COLUMNS} WHERE r.reporter_id = ? ORDER BY r.id DESC LIMIT 50`)
    .bind(userId)
    .all();

  return (rows.results || []).map(shape);
}

/** One report, for the staff page after an action. */
async function find(db, id) {
  const row = await db.prepare(`SELECT ${COLUMNS} WHERE r.id = ?`).bind(Number(id) || 0).first();
  return row ? shape(row) : null;
}

/**
 * Closes one report.
 *
 * The rank is checked here rather than only in the route, because the route is
 * where the button is drawn. A handled report and a dismissed one both leave the
 * queue; the difference is what the note means, and both are written to the
 * audit log so "who closed this and why" is answerable later.
 */
async function close(db, options) {
  const opts = options || {};
  const actor = opts.actor || {};

  if ((Number(actor.rank) || 0) < REVIEW_RANK) return { ok: false, code: 'rank' };

  const action = String(opts.action || '');
  if (action !== 'handled' && action !== 'dismissed') return { ok: false, code: 'action' };

  const report = await find(db, opts.id);
  if (!report) return { ok: false, code: 'noreport' };
  if (report.status !== 'open') return { ok: false, code: 'closed' };

  const note = String(opts.note || '').trim().slice(0, DETAIL_MAX);
  const now = isoNow();

  await db
    .prepare(
      `UPDATE reports
          SET status = ?, handled_by = ?, handled_at = ?, note = ?
        WHERE id = ? AND status = 'open'`
    )
    .bind(action, actor.id || null, now, note, report.id)
    .run();

  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(
      actor.id || null,
      report.targetId || null,
      `report_${action}`,
      `#${report.id} ${report.kindLabel.toLowerCase()} report about ${report.target} (${report.reasonLabel})`,
      now
    )
    .run();

  return { ok: true, code: action, id: report.id };
}

module.exports = {
  DETAIL_MAX,
  KIND_LABELS: KINDS_LABEL,
  KINDS,
  REASONS,
  REVIEW_RANK,
  close,
  closed,
  create,
  find,
  formatDate,
  mine,
  openCount,
  queue,
  reasonLabel,
  shape,
};
