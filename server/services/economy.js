/**
 * Spending and wearing.
 *
 * Every balance change writes a ledger row, and the balance itself is changed by
 * a guarded UPDATE (`WHERE tickets >= ?`) rather than by reading a number,
 * deciding, and writing it back: two purchases at once cannot both pass the
 * check and leave an account overdrawn.
 *
 * Prices come from the item row, never from the form. The form sends a currency
 * name; the browser cannot send a price.
 */

const CURRENCIES = ['tickets', 'bucks'];

/** The two balances, as numbers. */
async function balance(db, userId) {
  const row = await db
    .prepare('SELECT tickets, bucks FROM users WHERE id = ?')
    .bind(userId)
    .first();

  if (!row) return { tickets: 0, bucks: 0 };
  return { tickets: Number(row.tickets) || 0, bucks: Number(row.bucks) || 0 };
}

/**
 * Buy one item.
 *
 * Codes: currency (that price is not set), gone (not on sale), owned (already
 * bought), funds (not enough), bought.
 */
async function buy(db, options) {
  const opts = options || {};
  const currency = String(opts.currency || '');

  if (!CURRENCIES.includes(currency)) return { ok: false, code: 'currency' };

  const item = await db
    .prepare('SELECT id, name, tickets, bucks, on_sale FROM catalog_items WHERE id = ?')
    .bind(Number(opts.itemId) || 0)
    .first();

  if (!item || !item.on_sale) return { ok: false, code: 'gone' };

  const price = item[currency] === null ? null : Number(item[currency]);
  if (price === null) return { ok: false, code: 'currency' };

  const already = await db
    .prepare('SELECT 1 AS n FROM user_items WHERE user_id = ? AND item_id = ?')
    .bind(opts.userId, item.id)
    .first();

  if (already) return { ok: false, code: 'owned' };

  const paid = await db
    .prepare(`UPDATE users SET ${currency} = ${currency} - ? WHERE id = ? AND ${currency} >= ?`)
    .bind(price, opts.userId, price)
    .run();

  if (!paid || !paid.meta || Number(paid.meta.changes) === 0) {
    return { ok: false, code: 'funds' };
  }

  await db
    .prepare('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)')
    .bind(opts.userId, item.id)
    .run();

  // balance_after is read from the row in the same statement, so the ledger
  // cannot disagree with the balance it describes.
  await db
    .prepare(
      `INSERT INTO ledger (user_id, currency, delta, balance_after, reason, ref)
       SELECT id, ?, ?, ${currency}, ?, ? FROM users WHERE id = ?`
    )
    .bind(currency, -price, `Bought ${item.name}`, `item:${item.id}`, opts.userId)
    .run();

  return { ok: true, code: 'bought', name: item.name };
}

/**
 * Put an item on, or take it off.
 *
 * One item per category is worn at a time, which is what a hat slot and a shirt
 * slot mean; putting on a second hat takes the first one off.
 */
async function equip(db, options) {
  const opts = options || {};
  const on = Boolean(opts.on);

  const row = await db
    .prepare(
      `SELECT i.id, i.name, i.category
         FROM user_items ui
         JOIN catalog_items i ON i.id = ui.item_id
        WHERE ui.user_id = ? AND ui.item_id = ?`
    )
    .bind(opts.userId, Number(opts.itemId) || 0)
    .first();

  if (!row) return { ok: false, code: 'notowned' };

  if (on) {
    await db
      .prepare(
        `UPDATE user_items SET equipped = 0
          WHERE user_id = ?
            AND item_id IN (SELECT id FROM catalog_items WHERE category = ?)`
      )
      .bind(opts.userId, row.category)
      .run();
  }

  await db
    .prepare('UPDATE user_items SET equipped = ? WHERE user_id = ? AND item_id = ?')
    .bind(on ? 1 : 0, opts.userId, row.id)
    .run();

  return { ok: true, code: on ? 'wearing' : 'taken_off', name: row.name };
}

module.exports = { CURRENCIES, balance, buy, equip };
