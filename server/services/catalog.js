/**
 * The catalog, read from D1.
 *
 * Shapes match what the templates already used with the fixture list, so the
 * views only had to learn about `image` and the real ownership flags.
 *
 * Ownership comes from user_items, not from a column on the viewer, so the same
 * item page answers "do I own this" for whoever is signed in.
 */

/** Colours used when an item has no image. Stable per item id. */
const THUMBS = ['#c05a5a', '#c08a3a', '#9aa53f', '#4f9a6a', '#3f8aa5', '#6a5aa5', '#a55a8a'];

const JOINS = `
  FROM catalog_items i
  JOIN users u ON u.id = i.creator_id
  LEFT JOIN catalog_item_details d ON d.item_id = i.id
  LEFT JOIN user_items ui ON ui.item_id = i.id AND ui.user_id = ?
`;

const COLUMNS = `
  i.id, i.name, i.category, i.tickets, i.bucks, i.on_sale, i.created_at,
  u.username AS creator,
  COALESCE(d.description, '') AS description,
  COALESCE(d.image, '') AS image,
  CASE WHEN ui.item_id IS NULL THEN 0 ELSE 1 END AS owned,
  COALESCE(ui.equipped, 0) AS equipped
`;

function shape(row) {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    creator: row.creator,
    tickets: row.tickets === null ? null : Number(row.tickets),
    bucks: row.bucks === null ? null : Number(row.bucks),
    description: row.description || '',
    image: row.image || '',
    onSale: Boolean(row.on_sale),
    owned: Boolean(row.owned),
    equipped: Boolean(row.equipped),
    // Kept so a template can draw a colour swatch when there is no image.
    thumb: THUMBS[Number(row.id) % THUMBS.length],
  };
}

async function list(db, options = {}) {
  const where = ['i.on_sale = 1'];
  const params = [];

  if (options.category) {
    where.push('i.category = ?');
    params.push(String(options.category));
  }

  if (options.creator) {
    where.push('LOWER(u.username) = ?');
    params.push(String(options.creator).toLowerCase());
  }

  if (options.query) {
    const needle = `%${String(options.query).toLowerCase()}%`;
    where.push('(LOWER(i.name) LIKE ? OR LOWER(u.username) LIKE ?)');
    params.push(needle, needle);
  }

  const result = await db
    .prepare(
      `SELECT ${COLUMNS} ${JOINS}
        WHERE ${where.join(' AND ')}
        ORDER BY i.created_at DESC, i.id DESC
        LIMIT 200`
    )
    .bind(options.viewerId || 0, ...params)
    .all();

  return (result.results || []).map(shape);
}

/** One item by numeric id, with a fallback match on its name. */
async function findOne(db, idOrName, viewerId) {
  const param = String(idOrName || '').trim();
  if (!param) return null;

  const row = /^\d+$/.test(param)
    ? await db
        .prepare(`SELECT ${COLUMNS} ${JOINS} WHERE i.id = ?`)
        .bind(viewerId || 0, Number(param))
        .first()
    : await db
        .prepare(`SELECT ${COLUMNS} ${JOINS} WHERE LOWER(i.name) = ?`)
        .bind(viewerId || 0, param.toLowerCase())
        .first();

  return row ? shape(row) : null;
}

/** Other items by the same creator, for the sidebar of an item page. */
async function moreByCreator(db, item, viewerId) {
  const result = await db
    .prepare(
      `SELECT ${COLUMNS} ${JOINS}
        WHERE LOWER(u.username) = LOWER(?) AND i.id <> ? AND i.on_sale = 1
        ORDER BY i.created_at DESC
        LIMIT 5`
    )
    .bind(viewerId || 0, item.creator, item.id)
    .all();

  return (result.results || []).map(shape);
}

/** What this account owns, newest first. */
async function owned(db, userId) {
  const result = await db
    .prepare(
      `SELECT ${COLUMNS} ${JOINS}
        WHERE ui.item_id IS NOT NULL
        ORDER BY ui.acquired_at DESC, i.name ASC`
    )
    .bind(userId)
    .all();

  return (result.results || []).map(shape);
}

/** Creators with something on sale, for the facet list. */
async function creators(db) {
  const result = await db
    .prepare(
      `SELECT DISTINCT u.username AS name
         FROM catalog_items i
         JOIN users u ON u.id = i.creator_id
        WHERE i.on_sale = 1
        ORDER BY u.username ASC`
    )
    .all();

  return (result.results || []).map((row) => row.name);
}

module.exports = { findOne, creators, list, moreByCreator, owned, shape };
