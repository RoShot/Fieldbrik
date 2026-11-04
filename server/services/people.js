/**
 * The member directory, profiles and friends, read from D1.
 *
 * Every function returns the same shape the templates already used with the
 * phase 1 fixtures, so no view had to change: one object per person with
 * avatar, currency, statistics and an online flag.
 *
 * Counts come from correlated subqueries rather than one query per row. The
 * site is small, but a directory page that runs five queries per member is the
 * kind of thing that stays in the code long after it stops being small.
 */

const accounts = require('./accounts');
const badgeArt = require('./badges');

const PERSON_COLUMNS = `
  u.id, u.username, u.role, u.created_at, u.last_seen_at, u.description, u.tickets, u.bucks,
  a.head, a.torso, a.left_arm, a.right_arm, a.left_leg, a.right_leg, a.face,
  (SELECT COUNT(*) FROM friendships f
     WHERE f.status = 'accepted' AND (f.user_a = u.id OR f.user_b = u.id)) AS friend_count,
  (SELECT COUNT(*) FROM user_badges b WHERE b.user_id = u.id) AS badge_count,
  (SELECT COUNT(*) FROM games g WHERE g.creator_id = u.id AND g.published = 1) AS game_count,
  (SELECT COUNT(*) FROM user_items i WHERE i.user_id = u.id) AS item_count,
  -- Presence is written by the request that was signed in (accounts.touchLastSeen)
  -- and reads as "seen in the last five minutes". A session lasts a fortnight,
  -- so session age said nothing about whether anybody was here.
  CASE WHEN u.last_seen_at IS NOT NULL
        AND u.last_seen_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 minutes')
       THEN 1 ELSE 0 END AS is_online
`;

const PERSON_FROM = `
  FROM users u
  LEFT JOIN avatars a ON a.user_id = u.id
`;

/** Order matches the sort facets the directory page offers. */
const ORDER = {
  name: 'u.username_lower ASC',
  newest: 'u.created_at DESC',
  friends: 'friend_count DESC, u.username_lower ASC',
};

/**
 * Presence comes from last_seen_at, which a signed-in request writes. Someone
 * who never signed in has no last_seen_at at all and reads as offline rather
 * than "online because they are new".
 */
function shape(row) {
  const person = accounts.toViewer(row, row, {
    friends: row.friend_count || 0,
    badges: row.badge_count || 0,
    games: row.game_count || 0,
    items: row.item_count || 0,
  });

  person.online = Boolean(row.is_online);
  return person;
}

async function list(db, options = {}) {
  const query = String(options.query || '').trim();
  const where = ['u.closed_at IS NULL'];
  const params = [];

  if (query) {
    where.push('u.username_lower LIKE ?');
    params.push(`%${query.toLowerCase()}%`);
  }

  const order = ORDER[options.sort] || ORDER.name;

  const result = await db
    .prepare(`SELECT ${PERSON_COLUMNS} ${PERSON_FROM} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 100`)
    .bind(...params)
    .all();

  return (result.results || []).map(shape);
}

async function findOne(db, username) {
  const wanted = String(username || '').trim().toLowerCase();
  if (!wanted) return null;

  const row = await db
    .prepare(`SELECT ${PERSON_COLUMNS} ${PERSON_FROM} WHERE u.username_lower = ? AND u.closed_at IS NULL`)
    .bind(wanted)
    .first();

  return row ? shape(row) : null;
}

/**
 * Who is here right now, newest presence first.
 *
 * Presence is the same five-minute rule the directory and the panel use: a
 * signed-in request writes last_seen_at, so this is a list of accounts that have
 * been seen recently, not a list of accounts that are simply new.
 */
async function online(db, limit) {
  const result = await db
    .prepare(
      `SELECT ${PERSON_COLUMNS} ${PERSON_FROM}
        WHERE u.closed_at IS NULL
          AND u.last_seen_at IS NOT NULL
          AND u.last_seen_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 minutes')
        ORDER BY u.last_seen_at DESC
        LIMIT ?`
    )
    .bind(Math.max(1, Math.min(Number(limit) || 10, 50)))
    .all();

  return (result.results || []).map(shape);
}

/** The people this account has an accepted friendship with. */
async function friendsOf(db, userId) {
  const result = await db
    .prepare(
      `SELECT ${PERSON_COLUMNS}
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END
         LEFT JOIN avatars a ON a.user_id = u.id
        WHERE f.status = 'accepted' AND (f.user_a = ? OR f.user_b = ?)
        ORDER BY u.username_lower ASC`
    )
    .bind(userId, userId, userId)
    .all();

  return (result.results || []).map(shape);
}

/**
 * Pending requests. 'incoming' is a request somebody else sent, 'outgoing' is
 * one this account sent. requested_by is the only thing that distinguishes
 * them, because a pair is stored once.
 */
async function pending(db, userId, direction) {
  const comparison = direction === 'outgoing' ? '=' : '!=';

  const result = await db
    .prepare(
      `SELECT ${PERSON_COLUMNS}
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.user_a = ? THEN f.user_b ELSE f.user_a END
         LEFT JOIN avatars a ON a.user_id = u.id
        WHERE f.status = 'pending'
          AND (f.user_a = ? OR f.user_b = ?)
          AND f.requested_by ${comparison} ?
        ORDER BY f.created_at DESC`
    )
    .bind(userId, userId, userId, userId)
    .all();

  return (result.results || []).map(shape);
}

/** Badge definitions this account holds, for the profile panel. */
async function badgesFor(db, userId) {
  const result = await db
    .prepare(
      `SELECT b.key, b.name, b.description, b.color
         FROM user_badges ub
         JOIN badges b ON b.key = ub.badge_key
        WHERE ub.user_id = ?
        ORDER BY ub.granted_at ASC`
    )
    .bind(userId)
    .all();

  return (result.results || []).map((row) => ({
    key: row.key,
    name: row.name,
    description: row.description,
    color: row.color,
    art: badgeArt.artFor(row.key),
  }));
}

/** Published places this account made, for the profile panel. */
async function gamesFor(db, userId) {
  const result = await db
    .prepare(
      `SELECT id, slug, name, visits, created_at
         FROM games
        WHERE creator_id = ? AND published = 1
        ORDER BY updated_at DESC
        LIMIT 6`
    )
    .bind(userId)
    .all();

  // The slug, not the id, is what a place is linked by: it is the address the
  // Games page and every place link use, and it survives a rename. `visits` is
  // carried because the column exists, but nothing counts one yet - the profile
  // panel says so rather than printing a zero.
  return (result.results || []).map((game) => ({
    id: Number(game.id),
    slug: game.slug,
    name: game.name,
    visits: Number(game.visits) || 0,
    created: String(game.created_at || '').slice(0, 10),
    thumb: '#8a6fb5',
  }));
}

module.exports = { badgesFor, findOne, friendsOf, gamesFor, list, online, pending, shape };
