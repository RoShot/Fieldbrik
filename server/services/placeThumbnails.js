/**
 * Place thumbnails: the small picture on a place page and on its tiles.
 *
 * The bytes are stored beside the place row as base64 in one TEXT column, for
 * the same reason place files are text: the Worker and Express then share one
 * code path and one storage plan, with no image binding to keep in step. The cap
 * is 256 KB of image, which base64 inflates to about 341 KB - still well under
 * D1's 2 MB row limit.
 *
 * PNG and JPEG are the only accepted formats, and only because their first bytes
 * say so. An extension is not evidence: the browser resizes the picture to
 * 320x200 before sending it, so a thumbnail is a thumbnail and not a photo off a
 * camera that would waste the member's data on a tile.
 */

const places = require('./places');

const MAX_BYTES = 256 * 1024;
const MAX_ENCODED = Math.ceil((MAX_BYTES * 4) / 3) + 1024;

/** The two formats a tile can show, recognised by their opening bytes. */
const FORMATS = [
  { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
];

function startsWith(bytes, magic) {
  if (bytes.length < magic.length) return false;
  return magic.every((value, index) => bytes[index] === value);
}

function toBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array(value || []);
}

/**
 * Base64 or a whole data URL in, bytes out. The declared media type in a data
 * URL is ignored: `inspect` reads the picture itself.
 *
 * Codes: empty, size. A payload too long to be a thumbnail is reported as a
 * size problem, not as an empty one, so the member is told which limit they
 * crossed.
 */
function decodeBase64(value) {
  const text = String(value || '').trim();
  if (!text) return { ok: false, code: 'empty' };

  const comma = text.indexOf(',');
  const payload = text.slice(0, 5) === 'data:' && comma !== -1 ? text.slice(comma + 1) : text;
  if (!payload) return { ok: false, code: 'empty' };
  if (payload.length > MAX_ENCODED) return { ok: false, code: 'size' };

  const cleaned = payload.replace(/\s+/g, '');
  if (!cleaned || !/^[A-Za-z0-9+/]+={0,2}$/.test(cleaned)) return { ok: false, code: 'empty' };

  try {
    return { ok: true, bytes: new Uint8Array(Buffer.from(cleaned, 'base64')) };
  } catch (error) {
    return { ok: false, code: 'empty' };
  }
}

function encodeBase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

/** Codes: empty, size, format. */
function inspect(value) {
  const bytes = toBytes(value);

  if (!bytes.length) return { ok: false, code: 'empty' };
  if (bytes.length > MAX_BYTES) return { ok: false, code: 'size' };

  const format = FORMATS.find((entry) => startsWith(bytes, entry.magic));
  if (!format) return { ok: false, code: 'format' };

  return { ok: true, mime: format.mime, bytes };
}

/**
 * Codes: no_place, not_yours, empty, size, format, refused.
 *
 * The owner check is here rather than in the route so posting a JSON body with
 * somebody else's place id is refused even if a caller forgets to look.
 */
async function set(db, options) {
  const opts = options || {};

  const place = await places.findById(db, opts.placeId);
  if (!place) return { ok: false, code: 'no_place' };
  if (String(place.creatorId) !== String(opts.actorId)) return { ok: false, code: 'not_yours' };

  const decoded = decodeBase64(opts.content);
  if (!decoded.ok) return { ok: false, code: decoded.code };

  const checked = inspect(decoded.bytes);
  if (!checked.ok) return { ok: false, code: checked.code };

  const result = await db
    .prepare(
      `INSERT INTO place_thumbnails (game_id, content, content_type, updated_at)
       VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
       ON CONFLICT (game_id) DO UPDATE
          SET content = excluded.content,
              content_type = excluded.content_type,
              updated_at = excluded.updated_at`
    )
    .bind(place.id, encodeBase64(checked.bytes), checked.mime)
    .run();

  if (!result || (result.meta && result.meta.changes === 0)) return { ok: false, code: 'refused' };

  return {
    ok: true,
    code: 'thumbnail',
    thumbnail: {
      type: checked.mime,
      size: checked.bytes.length,
      url: thumbnailUrl(place.slug, (await latest(db, place.id)) || {}),
    },
  };
}

/**
 * The stored image for a place, ready to serve. Null when the place has none,
 * which is the ordinary case for a place nobody has given a picture yet.
 */
async function latest(db, placeId) {
  const row = await db
    .prepare(
      `SELECT content, content_type, updated_at
         FROM place_thumbnails
        WHERE game_id = ?`
    )
    .bind(Number(placeId) || 0)
    .first();

  if (!row || !row.content) return null;

  let bytes;
  try {
    bytes = new Uint8Array(Buffer.from(String(row.content), 'base64'));
  } catch (error) {
    return null;
  }

  if (!bytes.length) return null;

  const checked = inspect(bytes);
  if (!checked.ok) return null;

  return {
    bytes: checked.bytes,
    type: checked.mime,
    at: String(row.updated_at || ''),
    etag: `"${String(row.updated_at || 'none').replace(/[^0-9A-Za-z]/g, '')}"`,
  };
}

/** The address a tile points at, with the upload time so a new one is not cached. */
function thumbnailUrl(slug, thumbnail) {
  if (!slug || !thumbnail || !thumbnail.at) return null;
  return `/games/${slug}/thumbnail?v=${encodeURIComponent(thumbnail.at)}`;
}

module.exports = {
  MAX_BYTES,
  encodeBase64,
  inspect,
  latest,
  set,
  thumbnailUrl,
};
