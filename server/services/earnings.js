/**
 * How Tickets are earned.
 *
 * Two earners, both written through the ledger so a balance never moves without
 * a line that explains it:
 *
 *   the daily bonus   once per UTC day per account, sized by the Carpenters Club
 *                     tier that is active at that moment
 *   visit milestones  for a place you own, every N visits pays a fixed amount,
 *                     once per milestone
 *
 * Both use one INSERT ... SELECT ... WHERE NOT EXISTS as the gate. SQLite writes
 * one statement at a time, so two requests at once cannot both win: the second
 * sees the ledger row and inserts nothing. That is why the claim is a single
 * statement rather than a read followed by a write, which would race.
 *
 * balance_after is computed as `tickets + ?` inside the same statement, so it is
 * the balance the account holds after the award, without a second query.
 */

const settings = require('./settings');
const club = require('./club');

/** One award per account per UTC day, keyed on the day. */
function dayKey(now) {
  return new Date(now || Date.now()).toISOString().slice(0, 10);
}

/** The Club tier that decides the daily bonus, or '' for a free account. */
async function activeTier(db, userId) {
  if (!db || !userId) return '';
  const membership = await club.activeFor(db, userId);
  return membership ? membership.tier : '';
}

/**
 * The daily bonus for one tier.
 *
 * The tier rate is the whole daily award, not a bonus added to the free rate:
 * Carpenters Club members get 150 a day, not 250. An unknown tier falls back to
 * the free rate rather than to zero.
 */
function dailyFor(rates, tierKey) {
  const key = `earn.daily.tickets.${tierKey}`;
  const value = tierKey && Object.prototype.hasOwnProperty.call(rates, key) ? rates[key] : null;
  return Number.isFinite(value) ? value : rates['earn.daily.tickets'];
}

/** The Bucks part of the daily award, which only one tier has. */
function dailyBucksFor(rates, tierKey) {
  const key = `earn.daily.bucks.${tierKey}`;
  const value = tierKey && Object.prototype.hasOwnProperty.call(rates, key) ? rates[key] : 0;
  return Number.isFinite(value) ? value : 0;
}

/**
 * Adds to one balance and records it, or does nothing if this ref is already in
 * the ledger. Returns whether the award happened.
 */
async function awardOnce(db, options) {
  const opts = options || {};
  const amount = Number(opts.amount) || 0;
  if (amount <= 0) return { awarded: false, code: 'zero' };

  const currency = opts.currency === 'bucks' ? 'bucks' : 'tickets';

  const inserted = await db
    .prepare(
      `INSERT INTO ledger (user_id, currency, delta, balance_after, reason, ref, created_at)
       SELECT id, ?, ?, ${currency} + ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         FROM users
        WHERE id = ?
          AND NOT EXISTS (SELECT 1 FROM ledger l WHERE l.user_id = ? AND l.ref = ?)`
    )
    .bind(currency, amount, amount, opts.reason, opts.ref, opts.userId, opts.userId, opts.ref)
    .run();

  if (!inserted || !inserted.meta || Number(inserted.meta.changes) === 0) {
    return { awarded: false, code: 'claimed' };
  }

  await db
    .prepare(`UPDATE users SET ${currency} = ${currency} + ? WHERE id = ?`)
    .bind(amount, opts.userId)
    .run();

  return { awarded: true, amount, currency };
}

/**
 * The daily award, once per UTC day.
 *
 * Called on every signed-in page load, which is why the already-claimed case
 * costs one insert that matches no rows rather than a read first.
 */
async function claimDaily(db, userId, now) {
  if (!db || !userId) return { claimed: false };

  const rates = await settings.all(db);
  const tier = await activeTier(db, userId);
  const day = dayKey(now);

  const tickets = dailyFor(rates, tier);
  const bucks = dailyBucksFor(rates, tier);

  const ticketResult = await awardOnce(db, {
    userId,
    currency: 'tickets',
    amount: tickets,
    reason: tier ? `Daily Tickets (${club.tierName(tier)})` : 'Daily Tickets',
    ref: `daily:${day}`,
  });

  if (!ticketResult.awarded) return { claimed: false, day, tier };

  if (bucks > 0) {
    await awardOnce(db, {
      userId,
      currency: 'bucks',
      amount: bucks,
      reason: `Daily Bucks (${club.tierName(tier)})`,
      ref: `daily-bucks:${day}`,
    });
  }

  return { claimed: true, day, tier, tickets, bucks: bucks > 0 ? bucks : 0 };
}

/**
 * Visit milestones on the places this account owns.
 *
 * Every `earn.visits.block` visits pays `earn.visits.tickets`, once per
 * milestone: a place with 23 visits has earned two of them. Nothing increments
 * a visit yet, because visiting a place is not built, so this awards nothing
 * today - but the maths is here, and the page says so rather than showing a
 * reward that cannot happen.
 */
async function claimVisits(db, userId, now) {
  if (!db || !userId) return { awarded: 0, milestones: [] };

  const rates = await settings.all(db);
  const block = Math.max(1, Number(rates['earn.visits.block']) || 10);
  const reward = Number(rates['earn.visits.tickets']) || 0;

  const games = await db
    .prepare('SELECT id, name, visits FROM games WHERE creator_id = ? ORDER BY id ASC')
    .bind(userId)
    .all();

  const milestones = [];

  for (const game of games.results || []) {
    const reached = Math.floor((Number(game.visits) || 0) / block);
    if (reached < 1) continue;

    for (let step = 1; step <= reached; step += 1) {
      const at = step * block;
      const result = await awardOnce(db, {
        userId,
        currency: 'tickets',
        amount: reward,
        reason: `${at} visits on ${game.name}`,
        ref: `visits:${game.id}:${at}`,
      });

      if (result.awarded) milestones.push({ game: game.name, visits: at, tickets: reward });
    }
  }

  return { awarded: milestones.length, milestones, block, reward };
}

/** What the earnings page shows: rates, today's claim, and visit progress. */
async function status(db, userId, now) {
  const rates = await settings.all(db);
  const tier = await activeTier(db, userId);
  const day = dayKey(now);

  const claimed = db && userId
    ? await db
        .prepare('SELECT delta FROM ledger WHERE user_id = ? AND ref = ? ORDER BY id DESC LIMIT 1')
        .bind(userId, `daily:${day}`)
        .first()
    : null;

  const games = db && userId
    ? await db
        .prepare(
          `SELECT g.id, g.name, g.visits,
                  (SELECT COUNT(*) FROM ledger l
                    WHERE l.user_id = ? AND l.ref LIKE 'visits:' || g.id || ':%') AS awarded
             FROM games g
            WHERE g.creator_id = ?
            ORDER BY g.visits DESC, g.id ASC`
        )
        .bind(userId, userId)
        .all()
    : { results: [] };

  const block = Math.max(1, Number(rates['earn.visits.block']) || 10);
  const reward = Number(rates['earn.visits.tickets']) || 0;

  const free = Number(rates['earn.daily.tickets']) || 0;

  return {
    day,
    tier,
    tierName: tier ? club.tierName(tier) : '',
    dailyTickets: dailyFor(rates, tier),
    dailyBucks: dailyBucksFor(rates, tier),
    claimedToday: Boolean(claimed),
    claimedAmount: claimed ? Number(claimed.delta) || 0 : 0,
    rates,
    visitBlock: block,
    visitReward: reward,
    // Every tier's daily figure, so the page can show what a membership adds.
    ladder: [
      { label: 'Free account', tickets: free, bucks: 0 },
      { label: 'Carpenters Club', tickets: dailyFor(rates, 'carpenters_club'), bucks: 0 },
      { label: 'Carpenters Club Senior', tickets: dailyFor(rates, 'carpenters_club_senior'), bucks: 0 },
      {
        label: 'Outrageous Carpenters Club',
        tickets: dailyFor(rates, 'outrageous_carpenters_club'),
        bucks: dailyBucksFor(rates, 'outrageous_carpenters_club'),
      },
    ],
    places: (games.results || []).map((row) => {
      const visits = Number(row.visits) || 0;
      return {
        id: row.id,
        name: row.name,
        visits,
        milestones: Math.floor(visits / block),
        awarded: Number(row.awarded) || 0,
        nextAt: (Math.floor(visits / block) + 1) * block,
        progress: visits % block,
      };
    }),
  };
}

module.exports = {
  activeTier,
  awardOnce,
  claimDaily,
  claimVisits,
  dailyBucksFor,
  dailyFor,
  dayKey,
  status,
};
