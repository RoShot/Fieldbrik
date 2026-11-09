/**
 * Places: the rows in `games`, read and written.
 *
 * A place is a name, a description, an owner and one flag: published or not.
 * The world itself lives in `place_versions`, one row per publish. This service
 * keeps the listing and its visibility; `placeFiles` owns the file history.
 * Nothing increments `visits`, because a visit would have to be a real session
 * in a real place. The place page says so rather than printing a zero that looks
 * like "nobody came".
 *
 * The slug is made once, from the name, and then left alone. Renaming a place
 * must not break a link somebody pasted into the forum, so the URL is stable
 * even when the title is not.
 */

const NAME_MIN = 3;
const NAME_MAX = 60;
const DESC_MAX = 2000;

/** Colour swatches, stable per place id, because no place art exists. */
const THUMBS = ['#8a6fb5', '#5a8ab5', '#5ab58a', '#b58a5a', '#b55a8a', '#8ab55a'];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

const COLUMNS = `
  g.id, g.slug, g.name, g.description, g.visits, g.published,
  g.created_at, g.updated_at, g.creator_id,
  (t.game_id IS NOT NULL) AS has_thumbnail, t.updated_at AS thumbnail_at,
  u.username AS creator
    FROM games g
    JOIN users u ON u.id = g.creator_id
    LEFT JOIN place_thumbnails t ON t.game_id = g.id
`;

function shape(row) {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description || '',
    creator: row.creator,
    creatorId: Number(row.creator_id),
    visits: Number(row.visits) || 0,
    published: Boolean(row.published),
    created: String(row.created_at || '').slice(0, 10),
    updated: String(row.updated_at || '').slice(0, 10),
    thumb: THUMBS[Number(row.id) % THUMBS.length],
    // The swatch stays as the fallback a tile draws before the image loads, and
    // as the whole picture for a place nobody has given one yet.
    thumbnail: Number(row.has_thumbnail) === 1,
    thumbnailUrl:
      Number(row.has_thumbnail) === 1 && row.thumbnail_at
        ? `/games/${row.slug}/thumbnail?v=${encodeURIComponent(String(row.thumbnail_at))}`
        : null,
  };
}

/** A slug nobody has yet: name, then name-2, name-3. */
async function uniqueSlug(db, base) {
  const root = base || 'place';

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const taken = await db.prepare('SELECT 1 AS n FROM games WHERE slug = ?').bind(candidate).first();
    if (!taken) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}

/** Codes: name, description, refused. */
async function create(db, options) {
  const opts = options || {};
  const creatorId = Number(opts.creatorId) || 0;

  if (!creatorId) return { ok: false, code: 'refused' };

  const name = String(opts.name || '').trim();
  const description = String(opts.description || '').trim();

  if (name.length < NAME_MIN || name.length > NAME_MAX) return { ok: false, code: 'name' };
  if (description.length > DESC_MAX) return { ok: false, code: 'description' };

  const slug = await uniqueSlug(db, slugify(name));
  const published = opts.published ? 1 : 0;

  const inserted = await db
    .prepare(
      `INSERT INTO games (slug, name, creator_id, description, published)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(slug, name, creatorId, description, published)
    .run();

  const id = inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;
  if (!id) return { ok: false, code: 'refused' };

  return { ok: true, code: 'created', place: await findById(db, id) };
}

/** Codes: name, description, no_place, not_yours, refused. */
async function update(db, options) {
  const opts = options || {};
  const place = await findById(db, opts.placeId);

  if (!place) return { ok: false, code: 'no_place' };
  if (String(place.creatorId) !== String(opts.actorId)) return { ok: false, code: 'not_yours' };

  const name = String(opts.name || '').trim();
  const description = String(opts.description || '').trim();

  if (name.length < NAME_MIN || name.length > NAME_MAX) return { ok: false, code: 'name' };
  if (description.length > DESC_MAX) return { ok: false, code: 'description' };

  await db
    .prepare(
      `UPDATE games
          SET name = ?, description = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?`
    )
    .bind(name, description, place.id)
    .run();

  return { ok: true, code: 'saved', place: await findById(db, place.id) };
}

/** Codes: no_place, not_yours, refused. */
async function setPublished(db, options) {
  const opts = options || {};
  const place = await findById(db, opts.placeId);

  if (!place) return { ok: false, code: 'no_place' };
  if (String(place.creatorId) !== String(opts.actorId)) return { ok: false, code: 'not_yours' };

  const published = opts.published ? 1 : 0;

  await db
    .prepare(
      `UPDATE games
          SET published = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?`
    )
    .bind(published, place.id)
    .run();

  return { ok: true, code: published ? 'published' : 'unpublished' };
}

/** Published places only. Visits are not counted, so there is no visits sort. */
const ORDER = {
  newest: 'g.created_at DESC, g.id DESC',
  updated: 'g.updated_at DESC, g.id DESC',
  name: 'g.name ASC',
};

async function list(db, options) {
  const opts = options || {};
  const where = ['g.published = 1'];
  const params = [];

  if (opts.creator) {
    where.push('LOWER(u.username) = ?');
    params.push(String(opts.creator).toLowerCase());
  }

  if (opts.query) {
    const needle = `%${String(opts.query).toLowerCase()}%`;
    where.push('(LOWER(g.name) LIKE ? OR LOWER(u.username) LIKE ?)');
    params.push(needle, needle);
  }

  const result = await db
    .prepare(
      `SELECT ${COLUMNS} WHERE ${where.join(' AND ')}
        ORDER BY ${ORDER[opts.sort] || ORDER.newest}
        LIMIT 200`
    )
    .bind(...params)
    .all();

  return (result.results || []).map(shape);
}

/** One place by slug or id, published or not. Callers decide who may see it. */
async function findOne(db, value) {
  const param = String(value || '').trim();
  if (!param) return null;

  const byNumber = /^\d+$/.test(param);

  const row = await db
    .prepare(`SELECT ${COLUMNS} WHERE ${byNumber ? 'g.id' : 'g.slug'} = ?`)
    .bind(byNumber ? Number(param) : param.toLowerCase())
    .first();

  return row ? shape(row) : null;
}

function findById(db, id) {
  return findOne(db, String(Number(id) || 0));
}

/** Every place this member made, drafts included, newest first. */
async function mine(db, userId) {
  const result = await db
    .prepare(`SELECT ${COLUMNS} WHERE g.creator_id = ? ORDER BY g.created_at DESC, g.id DESC`)
    .bind(userId)
    .all();

  return (result.results || []).map(shape);
}

/** The newest published places, for the home page and My Page. */
function featured(db, limit) {
  return list(db, {}).then((places) => places.slice(0, Math.max(1, Number(limit) || 3)));
}

async function creators(db) {
  const result = await db
    .prepare(
      `SELECT u.username, COUNT(*) AS n
         FROM games g JOIN users u ON u.id = g.creator_id
        WHERE g.published = 1
        GROUP BY u.username
        ORDER BY u.username ASC`
    )
    .all();

  return (result.results || []).map((row) => row.username);
}

module.exports = {
  DESC_MAX,
  NAME_MAX,
  NAME_MIN,
  create,
  creators,
  featured,
  findById,
  findOne,
  list,
  mine,
  setPublished,
  shape,
  slugify,
  update,
};
