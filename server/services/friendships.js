/**
 * Friendships: requests, answers, and removing or blocking.
 *
 * A pair is stored once, with user_a always the lower id, because the table has
 * a CHECK for it and a primary key on the pair. That means a friendship cannot
 * exist twice in opposite directions, and `requested_by` is the only thing that
 * says who is waiting for an answer.
 *
 * Every refusal carries a short code as well as a message. The routes redirect
 * with the code so the page can say what happened without a message travelling
 * through the URL, where anyone could type one.
 */

class FriendError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FriendError';
    this.statusCode = 400;
    this.code = code || 'refused';
  }
}

function nowIso() {
  return new Date().toISOString();
}

/** user_a is always the lower id, so the pair has one canonical order. */
function pair(a, b) {
  return a < b ? [a, b] : [b, a];
}

async function target(db, username) {
  const wanted = String(username || '').trim().toLowerCase();

  if (!wanted) throw new FriendError('No member was named.', 'no_member');

  const row = await db
    .prepare('SELECT id, username, username_lower, closed_at FROM users WHERE username_lower = ?')
    .bind(wanted)
    .first();

  if (!row || row.closed_at) {
    throw new FriendError('There is no member by that name.', 'no_member');
  }

  return row;
}

function rowFor(db, aId, bId) {
  const [low, high] = pair(aId, bId);

  return db
    .prepare('SELECT * FROM friendships WHERE user_a = ? AND user_b = ?')
    .bind(low, high)
    .first();
}

/**
 * What the viewer is to this member: none, friends, incoming, outgoing,
 * blocked, or self.
 */
async function relationship(db, viewerId, otherId) {
  if (!viewerId || !otherId) return { state: 'none' };
  if (viewerId === otherId) return { state: 'self' };

  const row = await rowFor(db, viewerId, otherId);
  if (!row) return { state: 'none' };

  if (row.status === 'accepted') return { state: 'friends' };
  if (row.status === 'blocked') return { state: 'blocked', mine: row.requested_by === viewerId };

  if (row.status === 'pending') {
    return { state: row.requested_by === viewerId ? 'outgoing' : 'incoming' };
  }

  // Declined: the pair is free to ask again, which is what "none" allows.
  return { state: 'none' };
}

async function request(db, viewerId, username) {
  const person = await target(db, username);

  if (person.id === viewerId) {
    throw new FriendError('You cannot add yourself.', 'self');
  }

  const [low, high] = pair(viewerId, person.id);
  const existing = await rowFor(db, viewerId, person.id);

  if (existing) {
    if (existing.status === 'accepted') {
      throw new FriendError(`You are already friends with ${person.username}.`, 'already');
    }

    if (existing.status === 'blocked') {
      // Deliberately vague: whether the other person blocked you is not
      // something to confirm to whoever is guessing.
      throw new FriendError('That request cannot be sent.', 'blocked');
    }

    if (existing.status === 'pending') {
      throw new FriendError(
        existing.requested_by === viewerId
          ? `You have already asked ${person.username}.`
          : `${person.username} has already asked you. Answer it on the Friends page.`,
        existing.requested_by === viewerId ? 'duplicate' : 'answer_theirs'
      );
    }

    await db
      .prepare(
        `UPDATE friendships
            SET status = 'pending', requested_by = ?, created_at = ?, responded_at = NULL
          WHERE user_a = ? AND user_b = ?`
      )
      .bind(viewerId, nowIso(), low, high)
      .run();

    return { state: 'outgoing' };
  }

  await db
    .prepare(
      `INSERT INTO friendships (user_a, user_b, status, requested_by, created_at)
       VALUES (?, ?, 'pending', ?, ?)`
    )
    .bind(low, high, viewerId, nowIso())
    .run();

  return { state: 'outgoing' };
}

/** Accepts or declines a request addressed to the viewer. */
async function respond(db, viewerId, username, accept) {
  const person = await target(db, username);
  const row = await rowFor(db, viewerId, person.id);

  if (!row || row.status !== 'pending' || row.requested_by === viewerId) {
    throw new FriendError('There is no request from that member to answer.', 'wrong_way');
  }

  const [low, high] = pair(viewerId, person.id);

  await db
    .prepare('UPDATE friendships SET status = ?, responded_at = ? WHERE user_a = ? AND user_b = ?')
    .bind(accept ? 'accepted' : 'declined', nowIso(), low, high)
    .run();

  return { state: accept ? 'friends' : 'none' };
}

function accept(db, viewerId, username) {
  return respond(db, viewerId, username, true);
}

function decline(db, viewerId, username) {
  return respond(db, viewerId, username, false);
}

/** Withdraws a request the viewer sent. */
async function cancel(db, viewerId, username) {
  const person = await target(db, username);
  const row = await rowFor(db, viewerId, person.id);

  if (!row || row.status !== 'pending' || row.requested_by !== viewerId) {
    throw new FriendError('That request is not yours to cancel.', 'not_yours');
  }

  const [low, high] = pair(viewerId, person.id);
  await db.prepare('DELETE FROM friendships WHERE user_a = ? AND user_b = ?').bind(low, high).run();

  return { state: 'none' };
}

/**
 * Removes a friend, or lifts a block the viewer set. Blocking someone else's
 * friendship is not something this allows, because that would let one member
 * silently end an arrangement the other still believes in.
 */
async function remove(db, viewerId, username) {
  const person = await target(db, username);
  const row = await rowFor(db, viewerId, person.id);

  if (!row) throw new FriendError('You are not friends with that member.', 'not_friends');

  if (row.status === 'accepted') {
    // Fine: either side can end a friendship.
  } else if (row.status === 'blocked' && row.requested_by === viewerId) {
    // Unblocking, which is also a removal.
  } else {
    throw new FriendError('That is not something you can remove.', 'not_friends');
  }

  const [low, high] = pair(viewerId, person.id);
  await db.prepare('DELETE FROM friendships WHERE user_a = ? AND user_b = ?').bind(low, high).run();

  return { state: 'none' };
}

/**
 * Blocks a member. The row stays, so the block survives, but the status means
 * the pair are no longer friends and no request can be sent either way.
 */
async function block(db, viewerId, username) {
  const person = await target(db, username);

  if (person.id === viewerId) {
    throw new FriendError('You cannot block yourself.', 'self');
  }

  const [low, high] = pair(viewerId, person.id);
  const row = await rowFor(db, viewerId, person.id);

  if (row && row.status === 'blocked' && row.requested_by === viewerId) {
    throw new FriendError('That member is already blocked.', 'blocked');
  }

  if (row) {
    await db
      .prepare(
        `UPDATE friendships
            SET status = 'blocked', requested_by = ?, responded_at = ?
          WHERE user_a = ? AND user_b = ?`
      )
      .bind(viewerId, nowIso(), low, high)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO friendships (user_a, user_b, status, requested_by, created_at, responded_at)
         VALUES (?, ?, 'blocked', ?, ?, ?)`
      )
      .bind(low, high, viewerId, nowIso(), nowIso())
      .run();
  }

  return { state: 'blocked' };
}

module.exports = {
  FriendError,
  accept,
  block,
  cancel,
  decline,
  relationship,
  remove,
  request,
};
