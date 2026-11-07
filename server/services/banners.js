/**
 * The banner that runs under the member strip.
 *
 * It is one row: text, a background colour, a text colour, an optional link. The
 * newest enabled row is the one the site draws, so publishing a new banner is
 * one save, not an edit of the old one.
 *
 * The table is created on first use rather than by a migration script, because
 * the deployed database has no way to run one: `CREATE TABLE IF NOT EXISTS`
 * costs a round trip once per running process, and after that it is cached.
 * If DDL fails (a read-only replica, say) the banner simply does not appear; the
 * site does not break because a strip could not be drawn.
 */

const COLOUR = /^#[0-9a-fA-F]{6}$/;
const MAX_TEXT = 200;
const MAX_LINK = 200;

const CREATE = `CREATE TABLE IF NOT EXISTS banners (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  text       TEXT    NOT NULL,
  bg         TEXT    NOT NULL DEFAULT '#efefef',
  fg         TEXT    NOT NULL DEFAULT '#1e1e1e',
  link       TEXT,
  enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by INTEGER
)`;

let schema = null;

/** Creates the table once per process. Never throws: a failure means no banner. */
function ensure(db) {
  if (!schema) {
    schema = Promise.resolve()
      .then(() => db.prepare(CREATE).run())
      .catch(() => {
        schema = null;
        return null;
      });
  }

  return schema;
}

function shape(row) {
  return {
    id: Number(row.id),
    text: row.text,
    bg: row.bg,
    fg: row.fg,
    link: row.link || '',
    enabled: Boolean(Number(row.enabled)),
    createdAt: String(row.created_at || '').slice(0, 10),
    createdBy: row.created_by === null || row.created_by === undefined ? '' : String(row.created_by),
  };
}

/** The banner the site draws: the newest enabled row, or null. */
async function active(db) {
  try {
    await ensure(db);
    const row = await db
      .prepare('SELECT * FROM banners WHERE enabled = 1 ORDER BY id DESC LIMIT 1')
      .first();
    return row ? shape(row) : null;
  } catch (error) {
    return null;
  }
}

/** Everything in the table, newest first, for the panel. */
async function list(db) {
  await ensure(db);
  const result = await db.prepare('SELECT * FROM banners ORDER BY id DESC LIMIT 100').all();
  return (result.results || []).map(shape);
}

async function create(db, options) {
  const text = String(options.text || '').trim();
  const bg = String(options.bg || '').trim() || '#efefef';
  const fg = String(options.fg || '').trim() || '#1e1e1e';
  const link = String(options.link || '').trim();

  if (text.length < 2 || text.length > MAX_TEXT) return { ok: false, code: 'text' };
  if (!COLOUR.test(bg)) return { ok: false, code: 'bg' };
  if (!COLOUR.test(fg)) return { ok: false, code: 'fg' };
  if (link && !/^(https?:\/\/|\/)\S*$/.test(link)) return { ok: false, code: 'link' };
  if (link.length > MAX_LINK) return { ok: false, code: 'link' };

  await ensure(db);
  await db
    .prepare(
      'INSERT INTO banners (text, bg, fg, link, enabled, created_by) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(text, bg.toLowerCase(), fg.toLowerCase(), link || null, options.enabled ? 1 : 0, options.actorId || null)
    .run();

  return { ok: true, code: 'created' };
}

async function setEnabled(db, options) {
  const id = Number(options.id) || 0;
  await ensure(db);
  const row = await db.prepare('SELECT id FROM banners WHERE id = ?').bind(id).first();
  if (!row) return { ok: false, code: 'nobanner' };

  await db
    .prepare('UPDATE banners SET enabled = ? WHERE id = ?')
    .bind(options.enabled ? 1 : 0, id)
    .run();

  return { ok: true, code: options.enabled ? 'shown' : 'hidden' };
}

async function remove(db, options) {
  const id = Number(options.id) || 0;
  await ensure(db);
  const row = await db.prepare('SELECT id FROM banners WHERE id = ?').bind(id).first();
  if (!row) return { ok: false, code: 'nobanner' };

  await db.prepare('DELETE FROM banners WHERE id = ?').bind(id).run();
  return { ok: true, code: 'removed' };
}

module.exports = { active, create, list, remove, setEnabled, COLOUR, MAX_TEXT };
