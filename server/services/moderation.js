/**
 * Moderation actions.
 *
 * One place applies every action the panel offers, because each of them has to
 * do more than one thing: a ban writes a restriction, keeps the member's session
 * (so the notice can identify them), and logs. A poison ban is four writes plus
 * content removal. Spreading that across routes is how an action ends up
 * half-applied.
 *
 * Every function takes the database as its first argument, so the same code runs
 * on Express and in the Worker.
 */

const permissions = require('./permissions');
const admin = require('./admin');

/** Evidence is small on purpose: this is a screenshot, not an upload service. */
const MAX_EVIDENCE_BYTES = 128 * 1024;

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/** Reasons the panel offers as one-click fills. Free text is always allowed. */
const PRESETS = [
  'Spam',
  'Swear',
  'Personal Info',
  'Spam Alt',
  'Dating',
  'Inappropriate Talk',
  'Link',
  'Harassment',
  'Scam',
  'Bad Image',
];

/**
 * The actions, in the order the panel draws them.
 *
 * The ban lengths are separate buttons rather than a duration picker, as
 * specified. Each names the rank it needs, so a page cannot offer an action the
 * account is not allowed to perform.
 */
const ACTIONS = [
  { key: 'remind', label: 'Remind', cap: 'users.notice', hint: 'A private message, recorded on the account.' },
  { key: 'warn', label: 'Warn', cap: 'users.warn', hint: 'A warning on the account. Nothing is blocked.' },
  { key: 'ban_1d', label: 'Ban 1 day', cap: 'users.ban.short', days: 1 },
  { key: 'ban_3d', label: 'Ban 3 days', cap: 'users.ban.short', days: 3 },
  { key: 'ban_7d', label: 'Ban 7 days', cap: 'users.ban.short', days: 7 },
  { key: 'ban_14d', label: 'Ban 14 days', cap: 'users.ban.short', days: 14 },
  { key: 'ban_permanent', label: 'Ban permanently', cap: 'users.ban.permanent' },
  { key: 'delete', label: 'Delete account', cap: 'users.delete', hint: 'Closed, not erased. History is kept.' },
  { key: 'poison', label: 'Poison ban', cap: 'users.ban.poison', hint: 'Permanent ban, username scrubbed, email blacklisted, content removed.' },
  { key: 'note', label: 'Save note only', cap: 'users.view' },
  { key: 'unban', label: 'Lift active restriction', cap: 'users.ban.short' },
];

const ACTIONS_BY_KEY = ACTIONS.reduce((map, action) => {
  map[action.key] = action;
  return map;
}, {});

/** Only the actions this role may use are drawn or accepted. */
function available(role) {
  return ACTIONS.filter((action) => permissions.can(role, action.cap));
}

function token() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
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

function addDays(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function log(db, actor, target, action, detail) {
  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(actor.id, target.id, action, detail, new Date().toISOString())
    .run();
}

/**
 * Renames an account to CONTENT_DELETED_<id>, keeping the original.
 *
 * The name is the sign-in identifier, so a scrub is a lockout as well as a
 * rename. It is only offered alongside a ban for that reason.
 */
async function scrubUsername(db, target, actor) {
  const row = await db.prepare('SELECT id, username FROM users WHERE id = ?').bind(target.id).first();
  if (!row) return null;

  const replacement = `CONTENT_DELETED_${row.id}`;

  await db
    .prepare(
      `INSERT INTO username_scrubs (user_id, original_username, scrubbed_by)
       VALUES (?, ?, ?)
       ON CONFLICT (user_id) DO NOTHING`
    )
    .bind(row.id, row.username, actor.id)
    .run();

  await db
    .prepare('UPDATE users SET username = ?, username_lower = ? WHERE id = ?')
    .bind(replacement, replacement.toLowerCase(), row.id)
    .run();

  return { from: row.username, to: replacement };
}

async function removeContent(db, target) {
  await db.prepare('UPDATE games SET published = 0 WHERE creator_id = ?').bind(target.id).run();
  await db.prepare('DELETE FROM forum_posts WHERE author_id = ?').bind(target.id).run();
  await db.prepare('DELETE FROM forum_threads WHERE author_id = ?').bind(target.id).run();
  await db.prepare("UPDATE users SET description = '' WHERE id = ?").bind(target.id).run();
}

async function storeEvidence(db, restrictionId, file, actor) {
  const buffer = await file.arrayBuffer();
  const accessToken = token();

  await db
    .prepare(
      `INSERT INTO restriction_evidence
         (restriction_id, content_type, bytes, data, access_token, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(restrictionId, file.type, file.size, toBase64(buffer), accessToken, actor.id)
    .run();

  return accessToken;
}

/**
 * Applies one action.
 *
 * Returns a fixed code rather than a sentence, so the page can look the wording
 * up and never echoes anything from the request.
 */
async function apply(db, options) {
  const opts = options || {};
  const action = ACTIONS_BY_KEY[String(opts.action || '')];
  const actor = opts.actor || {};

  if (!action) return { ok: false, code: 'unknown' };
  if (!permissions.can({ rank: actor.rank }, action.cap)) return { ok: false, code: 'cap' };

  const target = await admin.findAccount(db, opts.targetId);
  if (!target) return { ok: false, code: 'nobody' };
  if (String(target.id) === String(actor.id)) return { ok: false, code: 'self' };
  if (target.roleRank >= Number(actor.rank)) return { ok: false, code: 'rank' };

  const reason = String(opts.reason || '').trim().slice(0, 500);
  const note = String(opts.note || '').trim().slice(0, 500);
  const file = opts.evidence && opts.evidence.size ? opts.evidence : null;

  const needsReason = ['remind', 'warn', 'delete', 'poison'].includes(action.key) || action.days;
  if (needsReason && !reason) return { ok: false, code: 'noreason' };

  // Validate the image before anything is written: a rejected upload must not
  // leave a ban behind that has no evidence attached.
  if (file) {
    if (!IMAGE_TYPES.includes(file.type)) return { ok: false, code: 'badimage' };
    if (file.size > MAX_EVIDENCE_BYTES) return { ok: false, code: 'toobig' };
  }

  const result = { ok: true, code: action.key };
  const detail = reason ? `${action.label}: ${reason}` : action.label;

  if (action.key === 'note') {
    if (!note) return { ok: false, code: 'nonote' };
    await db
      .prepare('INSERT INTO account_notes (user_id, author_id, body) VALUES (?, ?, ?)')
      .bind(target.id, actor.id, note)
      .run();
    await log(db, actor, target, 'note_added', note.slice(0, 160));
    return result;
  }

  if (action.key === 'remind') {
    await db
      .prepare(
        `INSERT INTO messages (from_id, to_id, subject, body)
         VALUES (?, ?, 'Reminder from FieldBrik staff', ?)`
      )
      .bind(actor.id, target.id, reason)
      .run();
    await log(db, actor, target, 'reminder_sent', reason.slice(0, 160));
    return result;
  }

  if (action.key === 'unban') {
    const lifted = await db
      .prepare(
        `UPDATE restrictions SET lifted_at = ?, lifted_by = ?
          WHERE user_id = ? AND lifted_at IS NULL
            AND kind IN ('restriction', 'ban')
            AND (expires_at IS NULL OR expires_at > ?)`
      )
      .bind(new Date().toISOString(), actor.id, target.id, new Date().toISOString())
      .run();

    await log(db, actor, target, 'restriction_lifted', note.slice(0, 160));
    result.lifted = lifted && lifted.meta ? Number(lifted.meta.changes) || 0 : 0;
    return result;
  }

  if (action.key === 'delete') {
    const now = new Date().toISOString();
    await db.prepare('UPDATE users SET closed_at = ? WHERE id = ?').bind(now, target.id).run();
    await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(target.id).run();
    await log(db, actor, target, 'account_closed', detail.slice(0, 160));
    return result;
  }

  const isBan = action.key === 'poison' || Boolean(action.days) || action.key === 'ban_permanent';
  const expiresAt =
    action.key === 'poison' || action.key === 'ban_permanent'
      ? null
      : action.days
        ? addDays(action.days)
        : null;
  const kind = isBan ? 'ban' : action.key === 'warn' ? 'warning' : 'restriction';

  const inserted = await db
    .prepare(
      `INSERT INTO restrictions (user_id, kind, reason, issued_by, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(target.id, kind, reason, actor.id, expiresAt)
    .run();

  const restrictionId = inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;

  if (file && restrictionId) {
    result.evidenceToken = await storeEvidence(db, restrictionId, file, actor);
  }

  if (action.key === 'poison') {
    const scrub = await scrubUsername(db, target, actor);
    result.scrubbed = scrub ? scrub.to : '';

    if (target.email) {
      await db
        .prepare(
          `INSERT INTO blacklisted_emails (email_lower, reason, added_by)
           VALUES (?, ?, ?)
           ON CONFLICT (email_lower) DO NOTHING`
        )
        .bind(target.email.toLowerCase(), `Poison ban on account ${target.id}`, actor.id)
        .run();
    }

    await removeContent(db, target);
  } else if (opts.scrub && isBan) {
    const scrub = await scrubUsername(db, target, actor);
    result.scrubbed = scrub ? scrub.to : '';
  }

  if (note) {
    await db
      .prepare('INSERT INTO account_notes (user_id, author_id, body) VALUES (?, ?, ?)')
      .bind(target.id, actor.id, note)
      .run();
  }

  await log(db, actor, target, isBan ? 'ban_issued' : 'warning_issued', detail.slice(0, 160));

  return result;
}

/** Restrictions with their ids, newest first, for the moderation page. */
async function history(db, userId) {
  const rows = await db
    .prepare(
      `SELECT r.id, r.kind, r.reason, r.issued_at, r.expires_at, r.lifted_at,
              a.username AS actor
         FROM restrictions r
         LEFT JOIN users a ON a.id = r.issued_by
        WHERE r.user_id = ?
        ORDER BY r.id DESC
        LIMIT 20`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map((row) => ({
    id: row.id,
    kind: row.kind,
    reason: row.reason,
    actor: row.actor || 'system',
    issued: formatDate(row.issued_at),
    expires: row.expires_at ? formatDate(row.expires_at) : 'no end date',
    lifted: row.lifted_at ? formatDate(row.lifted_at) : '',
  }));
}

async function notes(db, userId) {
  const rows = await db
    .prepare(
      `SELECT n.body, n.created_at, u.username AS author
         FROM account_notes n
         LEFT JOIN users u ON u.id = n.author_id
        WHERE n.user_id = ?
        ORDER BY n.id DESC
        LIMIT 20`
    )
    .bind(userId)
    .all();

  return (rows.results || []).map((row) => ({
    body: row.body,
    author: row.author || 'system',
    when: formatDate(row.created_at),
  }));
}

/** The active restriction's evidence token, if any. */
async function evidenceTokenFor(db, restrictionId) {
  const row = await db
    .prepare('SELECT access_token FROM restriction_evidence WHERE restriction_id = ? ORDER BY id DESC LIMIT 1')
    .bind(restrictionId)
    .first();

  return row ? row.access_token : '';
}

/** The name an account had before it was scrubbed, or an empty string. */
async function originalUsernameFor(db, userId) {
  const row = await db
    .prepare('SELECT original_username FROM username_scrubs WHERE user_id = ?')
    .bind(userId)
    .first();

  return row ? row.original_username : '';
}

/**
 * What the banned page shows.
 *
 * The member is still signed in on this device - a ban keeps their session,
 * because the page needs to know who they are in order to tell them why.
 */
async function bannerFor(db, user, restriction) {
  const token = await evidenceTokenFor(db, restriction.id);
  const scrub = await db
    .prepare('SELECT original_username FROM username_scrubs WHERE user_id = ?')
    .bind(user.id)
    .first();

  return {
    username: user.username,
    kind: restriction.kind,
    reason: restriction.reason,
    issued: formatDate(restriction.issued_at),
    until: restriction.expires_at ? formatDate(restriction.expires_at) : 'no end date',
    permanent: !restriction.expires_at,
    evidenceToken: token,
    scrubbedFrom: scrub ? scrub.original_username : '',
  };
}

module.exports = {
  ACTIONS,
  MAX_EVIDENCE_BYTES,
  PRESETS,
  apply,
  available,
  bannerFor,
  evidenceTokenFor,
  formatDate,
  history,
  notes,
  originalUsernameFor,
};
