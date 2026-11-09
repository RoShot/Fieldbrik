/**
 * Place files: the world itself, stored beside the listing.
 *
 * A `games` row is a listing; this service stores the file the listing is for.
 * Every publish is a new row, so a bad upload can be replaced without losing
 * the last good one, and the download endpoint always serves the newest.
 *
 * Only XML places are accepted. FieldBrik Studio writes XML with a <roblox>
 * root, and so do .rbxlx files and XML-saved .rbxl files. A binary .rbxl is a
 * different format and is refused with an explanation rather than stored as
 * mojibake.
 */

// D1 caps a single row at 2,000,000 bytes. Leave room for the filename,
// format, note and timestamps, so a file that validates can actually be stored.
const MAX_BYTES = 1536 * 1024;
const NOTE_MAX = 160;

const FORMATS = {
  fbrx: 'FieldBrik place (.fbrx)',
  rbxl: 'Roblox place (.rbxl, XML)',
  rbxlx: 'Roblox place (.rbxlx)',
  xml: 'XML place (.xml)',
};

const MIME = 'application/xml; charset=utf-8';

function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * A safe file name, without a path. A browser sends just the name; a tool that
 * sends a whole path gets the last segment, not a way to choose a directory.
 */
function cleanFilename(value) {
  const raw = String(value || '').trim();
  const name = raw.split(/[\\/]/).pop() || '';
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,119}$/.test(name)) return '';
  return name;
}

function formatOf(filename) {
  const match = /\.([A-Za-z0-9]+)$/.exec(String(filename || ''));
  if (!match) return '';
  const extension = match[1].toLowerCase();
  return Object.prototype.hasOwnProperty.call(FORMATS, extension) ? extension : '';
}

/**
 * The file must be a complete XML place. We do not parse it: the server never
 * renders it and the client's loader is the only thing that does. These checks
 * make sure a text file is actually the shape the loader expects, and refuse
 * DOCTYPE/ENTITY before a parser ever has a chance to fetch something.
 */
function hasPlaceShape(content) {
  if (!content || content.indexOf('\0') !== -1) return false;
  if (/<!DOCTYPE|<!ENTITY/i.test(content)) return false;

  const text = content.replace(/^\uFEFF/, '').trim();
  if (!text) return false;

  const root = text
    .replace(/^<\?xml[\s\S]*?\?>\s*/i, '')
    .replace(/^<!--[\s\S]*?-->\s*/i, '')
    .trim();

  return /^<roblox(?:\s|>)/i.test(root) && /<\/roblox>\s*$/i.test(text);
}

/**
 * Validate and shape an upload without touching the database.
 *
 * Codes: filename, format, empty, size, content.
 */
function validate(input) {
  const opts = input || {};
  const filename = cleanFilename(opts.filename);
  if (!filename) return { ok: false, code: 'filename' };

  const format = formatOf(filename);
  if (!format) return { ok: false, code: 'format' };

  const content = typeof opts.content === 'string' ? opts.content : '';
  if (!content.trim()) return { ok: false, code: 'empty' };

  // Refuse an oversized string before encoding it, so a huge body cannot spend
  // memory twice on the way to the same refusal.
  if (content.length > MAX_BYTES || byteLength(content) > MAX_BYTES) {
    return { ok: false, code: 'size' };
  }

  if (!hasPlaceShape(content)) return { ok: false, code: 'content' };

  const note = String(opts.note || '').trim().slice(0, NOTE_MAX);

  return {
    ok: true,
    filename,
    format,
    content,
    note,
    size: byteLength(content),
  };
}

function shape(row) {
  return {
    id: Number(row.id),
    version: Number(row.version),
    filename: row.filename,
    format: row.format,
    formatLabel: FORMATS[row.format] || FORMATS.xml,
    size: Number(row.size_bytes) || 0,
    note: row.note || '',
    created: String(row.created_at || '').slice(0, 10),
    createdAt: String(row.created_at || ''),
  };
}

function readableSize(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} bytes`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Publish one version. Codes: no_place, not_yours, filename, format, empty,
 * size, content, refused.
 */
async function addVersion(db, options) {
  const opts = options || {};
  const gameId = Number(opts.placeId) || 0;
  const actorId = Number(opts.actorId) || 0;

  const place = await db
    .prepare('SELECT id, creator_id FROM games WHERE id = ?')
    .bind(gameId)
    .first();

  if (!place) return { ok: false, code: 'no_place' };
  if (Number(place.creator_id) !== actorId) return { ok: false, code: 'not_yours' };

  const checked = validate(opts);
  if (!checked.ok) return checked;

  const next = await db
    .prepare(
      'SELECT COALESCE(MAX(version), 0) + 1 AS next FROM place_versions WHERE game_id = ?'
    )
    .bind(place.id)
    .first();

  const version = Number(next && next.next) || 1;

  try {
    await db
      .prepare(
        `INSERT INTO place_versions
           (game_id, version, filename, format, size_bytes, content, note, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        place.id,
        version,
        checked.filename,
        checked.format,
        checked.size,
        checked.content,
        checked.note,
        actorId
      )
      .run();
  } catch (error) {
    // The unique (game_id, version) constraint is the only expected failure:
    // two publishes raced. The caller can try again and get the next number.
    return { ok: false, code: 'refused' };
  }

  await db
    .prepare(
      `UPDATE games
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?`
    )
    .bind(place.id)
    .run();

  return {
    ok: true,
    code: 'uploaded',
    file: {
      version,
      filename: checked.filename,
      format: checked.format,
      formatLabel: FORMATS[checked.format],
      size: checked.size,
      note: checked.note,
    },
  };
}

/** The newest version's metadata, without its content. */
async function latest(db, gameId) {
  const row = await db
    .prepare(
      `SELECT id, version, filename, format, size_bytes, note, created_at
         FROM place_versions
        WHERE game_id = ?
        ORDER BY version DESC
        LIMIT 1`
    )
    .bind(Number(gameId) || 0)
    .first();

  return row ? shape(row) : null;
}

/** Recent versions, newest first, for the edit page. */
async function history(db, gameId, limit) {
  const count = Math.max(1, Math.min(20, Number(limit) || 5));
  const result = await db
    .prepare(
      `SELECT id, version, filename, format, size_bytes, note, created_at
         FROM place_versions
        WHERE game_id = ?
        ORDER BY version DESC
        LIMIT ?`
    )
    .bind(Number(gameId) || 0, count)
    .all();

  return (result.results || []).map(shape);
}

/** The newest file and its content, for the download endpoint. */
async function latestContent(db, gameId) {
  const row = await db
    .prepare(
      `SELECT id, version, filename, format, size_bytes, content, note, created_at
         FROM place_versions
        WHERE game_id = ?
        ORDER BY version DESC
        LIMIT 1`
    )
    .bind(Number(gameId) || 0)
    .first();

  if (!row) return null;

  return Object.assign(shape(row), { content: row.content, mime: MIME });
}

module.exports = {
  FORMATS,
  MAX_BYTES,
  MIME,
  NOTE_MAX,
  addVersion,
  formatOf,
  hasPlaceShape,
  history,
  latest,
  latestContent,
  readableSize,
  validate,
};
