/**
 * Catalog administration.
 *
 * The catalog was seed data, which meant a new hat needed a code change. This
 * is the write side: create an item, change its prices, its description or its
 * picture, and take it off sale without deleting the people who own it.
 *
 * Prices are stored as NULL when an item does not have that price, because the
 * schema's CHECK requires at least one of the two, and "sold only for Bucks" is
 * a real state rather than a zero.
 *
 * Nothing here deletes a row. An item that has been sold has ownership rows
 * pointing at it, and removing it would take those away from members who paid;
 * off sale is the honest equivalent, and it is reversible.
 */

const site = require('../config/site');

/** The categories the catalog page filters by, in one place. */
const CATEGORIES = ['Hats', 'Shirts', 'T-shirts', 'Pants', 'Accessories'];

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESCRIPTION_MAX = 1000;
const PRICE_MAX = 1000000;

/** Pictures live under public/img, and the path is stored as the URL serves it. */
const IMAGE_PATTERN = /^\/img\/[A-Za-z0-9._/-]+\.(png|jpe?g|webp|gif)$/i;

/** Swatch colours for an item with no picture, stable per item id. */
const THUMBS = ['#c05a5a', '#c08a3a', '#9aa53f', '#4f9a6a', '#3f8aa5', '#6a5aa5', '#a55a8a'];

function thumbFor(id, image) {
  return image ? THUMBS[Number(id) % THUMBS.length] : THUMBS[Number(id) % THUMBS.length];
}

/** Parses a price field: empty is "not sold for that", otherwise a whole number. */
function price(raw, code) {
  const text = String(raw === undefined || raw === null ? '' : raw).trim();
  if (text === '') return { ok: true, value: null };

  const number = Number(text);
  if (!Number.isInteger(number) || number < 0 || number > PRICE_MAX) {
    return { ok: false, code: code || 'price' };
  }

  return { ok: true, value: number };
}

/**
 * Validates a submitted item.
 *
 * Codes: name, category, price, both (no price at all), image, description.
 */
function validate(input) {
  const body = input || {};

  const name = String(body.name || '').trim().replace(/\s+/g, ' ');
  if (name.length < NAME_MIN || name.length > NAME_MAX) return { ok: false, code: 'name' };

  const category = String(body.category || '').trim();
  if (!CATEGORIES.includes(category)) return { ok: false, code: 'category' };

  const tickets = price(body.tickets, 'price');
  if (!tickets.ok) return { ok: false, code: tickets.code };

  const bucks = price(body.bucks, 'price');
  if (!bucks.ok) return { ok: false, code: bucks.code };

  if (tickets.value === null && bucks.value === null) return { ok: false, code: 'both' };

  const description = String(body.description || '').trim().slice(0, DESCRIPTION_MAX);

  const image = String(body.image || '').trim();
  if (image !== '' && !IMAGE_PATTERN.test(image)) return { ok: false, code: 'image' };

  return {
    ok: true,
    value: {
      name,
      category,
      tickets: tickets.value,
      bucks: bucks.value,
      description,
      image,
      onSale: String(body.on_sale || '') === '1',
    },
  };
}

/** Every item, newest first, on sale or not, with the two detail columns. */
async function list(db) {
  const rows = await db
    .prepare(
      `SELECT i.id, i.name, i.category, i.tickets, i.bucks, i.on_sale, i.created_at,
              u.username AS creator,
              (SELECT COUNT(*) FROM user_items ui WHERE ui.item_id = i.id) AS owners,
              COALESCE(d.description, '') AS description,
              COALESCE(d.image, '') AS image
         FROM catalog_items i
         JOIN users u ON u.id = i.creator_id
         LEFT JOIN catalog_item_details d ON d.item_id = i.id
        ORDER BY i.id DESC
        LIMIT 200`
    )
    .all();

  return (rows.results || []).map((row) => ({
    id: Number(row.id),
    name: row.name,
    category: row.category,
    tickets: row.tickets === null ? null : Number(row.tickets),
    bucks: row.bucks === null ? null : Number(row.bucks),
    onSale: Boolean(row.on_sale),
    creator: row.creator,
    owners: Number(row.owners) || 0,
    description: row.description || '',
    image: row.image || '',
    thumb: thumbFor(row.id, row.image),
  }));
}

/** One item for the edit form. */
async function find(db, id) {
  const row = await db
    .prepare(
      `SELECT i.id, i.name, i.category, i.tickets, i.bucks, i.on_sale,
              u.username AS creator,
              (SELECT COUNT(*) FROM user_items ui WHERE ui.item_id = i.id) AS owners,
              COALESCE(d.description, '') AS description,
              COALESCE(d.image, '') AS image
         FROM catalog_items i
         JOIN users u ON u.id = i.creator_id
         LEFT JOIN catalog_item_details d ON d.item_id = i.id
        WHERE i.id = ?`
    )
    .bind(Number(id) || 0)
    .first();

  if (!row) return null;

  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    tickets: row.tickets === null ? null : Number(row.tickets),
    bucks: row.bucks === null ? null : Number(row.bucks),
    onSale: Boolean(row.on_sale),
    creator: row.creator,
    owners: Number(row.owners) || 0,
    description: row.description || '',
    image: row.image || '',
    thumb: thumbFor(row.id, row.image),
  };
}

/** Whether another item already uses this name. */
async function nameTaken(db, name, exceptId) {
  const row = await db
    .prepare('SELECT id FROM catalog_items WHERE LOWER(name) = LOWER(?) AND id <> ?')
    .bind(name, Number(exceptId) || 0)
    .first();

  return Boolean(row);
}

async function audit(db, actorId, action, detail) {
  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, NULL, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
    )
    .bind(actorId || null, action, detail)
    .run();
}

/**
 * Creates an item owned by the staff member who created it.
 *
 * Codes: name, duplicate, category, price, both, image, nobody.
 */
async function create(db, input, actorId) {
  const checked = validate(input);
  if (!checked.ok) return checked;

  const item = checked.value;

  if (await nameTaken(db, item.name, 0)) return { ok: false, code: 'duplicate' };

  const actor = await db.prepare('SELECT id FROM users WHERE id = ?').bind(Number(actorId) || 0).first();
  if (!actor) return { ok: false, code: 'nobody' };

  const inserted = await db
    .prepare(
      `INSERT INTO catalog_items (name, category, creator_id, tickets, bucks, on_sale)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(item.name, item.category, actor.id, item.tickets, item.bucks, item.onSale ? 1 : 0)
    .run();

  const id = inserted && inserted.meta ? Number(inserted.meta.last_row_id) || 0 : 0;
  if (!id) return { ok: false, code: 'refused' };

  await db
    .prepare('INSERT INTO catalog_item_details (item_id, description, image) VALUES (?, ?, ?)')
    .bind(id, item.description, item.image)
    .run();

  await audit(db, actorId, 'catalog_created', `${item.name} (${item.category})`);

  return { ok: true, code: 'catalog_created', id, name: item.name };
}

/**
 * Updates an item.
 *
 * The details row is an upsert: an item created outside this page - the seed, or
 * an older row - has no details row, and editing it must still work.
 */
async function update(db, id, input, actorId) {
  const item = await find(db, id);
  if (!item) return { ok: false, code: 'nobody' };

  const checked = validate(input);
  if (!checked.ok) return checked;

  const next = checked.value;

  if (await nameTaken(db, next.name, item.id)) return { ok: false, code: 'duplicate' };

  await db
    .prepare(
      `UPDATE catalog_items
          SET name = ?, category = ?, tickets = ?, bucks = ?, on_sale = ?
        WHERE id = ?`
    )
    .bind(next.name, next.category, next.tickets, next.bucks, next.onSale ? 1 : 0, item.id)
    .run();

  await db
    .prepare(
      `INSERT INTO catalog_item_details (item_id, description, image)
       VALUES (?, ?, ?)
       ON CONFLICT (item_id) DO UPDATE SET
         description = excluded.description,
         image       = excluded.image`
    )
    .bind(item.id, next.description, next.image)
    .run();

  const prices = [
    next.tickets === null ? '' : `${next.tickets} Tickets`,
    next.bucks === null ? '' : `${next.bucks} Bucks`,
  ]
    .filter(Boolean)
    .join(' / ');

  await audit(
    db,
    actorId,
    'catalog_updated',
    `${next.name} (${next.category}, ${prices}${next.onSale ? '' : ', off sale'})`
  );

  return { ok: true, code: 'catalog_saved', id: item.id, name: next.name };
}

/** Takes an item off sale, or puts it back. Owners keep what they bought. */
async function setSale(db, id, onSale, actorId) {
  const item = await find(db, id);
  if (!item) return { ok: false, code: 'nobody' };

  if (item.onSale === Boolean(onSale)) {
    return { ok: true, code: onSale ? 'catalog_on' : 'catalog_off', name: item.name, unchanged: true };
  }

  await db
    .prepare('UPDATE catalog_items SET on_sale = ? WHERE id = ?')
    .bind(onSale ? 1 : 0, item.id)
    .run();

  await audit(db, actorId, onSale ? 'catalog_on_sale' : 'catalog_off_sale', item.name);

  return { ok: true, code: onSale ? 'catalog_on' : 'catalog_off', name: item.name };
}

/** The categories the form offers, and the site's currency wording. */
function facets() {
  return {
    categories: CATEGORIES,
    ticketsName: site.currency.earned,
    bucksName: site.currency.premium,
  };
}

module.exports = {
  CATEGORIES,
  DESCRIPTION_MAX,
  IMAGE_PATTERN,
  MAX_RATE: PRICE_MAX,
  NAME_MAX,
  NAME_MIN,
  PRICE_MAX,
  create,
  facets,
  find,
  list,
  price,
  setSale,
  update,
  validate,
};
