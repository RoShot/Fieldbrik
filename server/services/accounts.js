/**
 * Accounts: registration, sign-in, sessions and the restriction check.
 *
 * Every function takes the database as its first argument, so nothing here
 * reaches for a global. The Worker passes env.DB. There is no second copy of
 * this logic for another runtime, and no way to forget the database.
 */

const passwords = require('./passwords');
const usernamePolicy = require('./usernamePolicy');

const SESSION_DAYS = 14;
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

// Must match DEFAULT_AVATAR in public/avatar/avatar.js, so a new member looks
// like the starter character rather than an unstyled box.
const STARTER_AVATAR = {
  head: '#ffcc00',
  torso: '#f57c00',
  leftArm: '#111111',
  rightArm: '#111111',
  leftLeg: '#111111',
  rightLeg: '#111111',
  face: 'classic-smile',
};

class AccountError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccountError';
    this.statusCode = 400;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function validate(input) {
  const body = input || {};
  const username = String(body.username || '').trim();
  // Email is optional: the one form asks for a name and a password only. It is
  // still accepted and stored when something sends it.
  const email = String(body.email || '').trim();
  const password = String(body.password || '');
  const confirm = body.confirm === undefined ? password : String(body.confirm || '');

  if (!USERNAME.test(username)) {
    throw new AccountError(
      'A name is 3 to 20 characters, using letters, numbers and underscores only.'
    );
  }

  const policy = usernamePolicy.check(username);
  if (!policy.ok) {
    throw new AccountError(policy.reason);
  }

  if (email && !EMAIL.test(email)) {
    throw new AccountError('That does not look like an email address.');
  }

  if (password.length < MIN_PASSWORD) {
    throw new AccountError(`A password needs at least ${MIN_PASSWORD} characters.`);
  }

  if (password !== confirm) {
    throw new AccountError('The two passwords do not match.');
  }

  return { username, email, password };
}

function findById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
}

/**
 * The account with this name, or null. Used by the one form to decide whether
 * a submission is a log-in or a sign-up.
 */
function findByUsername(db, username) {
  const wanted = String(username || '').trim().toLowerCase();
  if (!wanted) return Promise.resolve(null);
  return db
    .prepare('SELECT * FROM users WHERE username_lower = ? AND closed_at IS NULL')
    .bind(wanted)
    .first();
}

async function register(db, input) {
  const clean = validate(input);

  const taken = await db
    .prepare('SELECT id FROM users WHERE username_lower = ?')
    .bind(clean.username.toLowerCase())
    .first();

  if (taken) {
    throw new AccountError('That username is already taken.');
  }

  const secret = await passwords.hash(clean.password);

  let userId;

  try {
    const result = await db
      .prepare(
        `INSERT INTO users
           (username, username_lower, email, email_lower,
            password_hash, password_salt, password_iterations)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        clean.username,
        clean.username.toLowerCase(),
        clean.email || null,
        clean.email ? clean.email.toLowerCase() : null,
        secret.hash,
        secret.salt,
        secret.iterations
      )
      .run();

    userId = result.meta.last_row_id;
  } catch (error) {
    // The unique indexes are the real guarantee; the lookup above only exists
    // to give a friendlier message in the common case.
    if (/UNIQUE/i.test(String(error && error.message))) {
      throw new AccountError('That username or email is already registered.');
    }
    throw error;
  }

  const a = STARTER_AVATAR;
  await db
    .prepare(
      `INSERT INTO avatars
         (user_id, head, torso, left_arm, right_arm, left_leg, right_leg, face)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(userId, a.head, a.torso, a.leftArm, a.rightArm, a.leftLeg, a.rightLeg, a.face)
    .run();

  return findById(db, userId);
}

/**
 * Checks a username and password.
 *
 * A wrong username and a wrong password produce the same message, and both cost
 * one PBKDF2 derivation, so neither the reply nor the timing says which was
 * wrong.
 */
async function authenticate(db, input) {
  const body = input || {};
  const wanted = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');

  const row = wanted
    ? await db
        .prepare('SELECT * FROM users WHERE username_lower = ? AND closed_at IS NULL')
        .bind(wanted)
        .first()
    : null;

  const stored = row
    ? {
        hash: row.password_hash,
        salt: row.password_salt,
        iterations: row.password_iterations,
      }
    : { hash: '0'.repeat(64), salt: '0'.repeat(32), iterations: passwords.ITERATIONS };

  const ok = await passwords.verify(password, stored);

  if (!row || !ok) {
    throw new AccountError('That username and password do not match.');
  }

  return row;
}

/** @returns {Promise<{token: string, expires: string}>} */
async function createSession(db, userId, options = {}) {
  const token = passwords.newToken();
  const tokenHash = await passwords.hashToken(token);
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const userAgent = String(options.userAgent || '').slice(0, 200);

  await db
    .prepare(
      `INSERT INTO sessions (token_hash, user_id, expires_at, user_agent)
       VALUES (?, ?, ?, ?)`
    )
    .bind(tokenHash, userId, expires, userAgent)
    .run();

  return { token, expires };
}

/** The signed-in user for a raw cookie token, or null. */
async function userForToken(db, token) {
  if (!token) return null;

  const tokenHash = await passwords.hashToken(token);

  const row = await db
    .prepare(
      `SELECT u.*
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ?
          AND s.expires_at > ?
          AND u.closed_at IS NULL`
    )
    .bind(tokenHash, nowIso())
    .first();

  return row || null;
}

async function touchSession(db, token) {
  if (!token) return;
  const tokenHash = await passwords.hashToken(token);
  await db.prepare('UPDATE sessions SET last_used = ? WHERE token_hash = ?')
    .bind(nowIso(), tokenHash)
    .run();
}

async function destroySession(db, token) {
  if (!token) return;
  const tokenHash = await passwords.hashToken(token);
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
}

/**
 * An active warning-free restriction, or null.
 *
 * Evaluated on every request rather than once at sign-in, so a restriction
 * applies immediately and a temporary one expires on its own.
 */
async function activeRestriction(db, userId) {
  return db
    .prepare(
      `SELECT *
         FROM restrictions
        WHERE user_id = ?
          AND lifted_at IS NULL
          AND kind IN ('restriction', 'ban')
          AND (expires_at IS NULL OR expires_at > ?)
        ORDER BY id DESC
        LIMIT 1`
    )
    .bind(userId, nowIso())
    .first();
}

/**
 * Shapes a database row into what the templates expect.
 *
 * The views were written against the phase 1 fixtures, so this is the one place
 * that maps column names (left_arm) onto template names (leftArm). When a page
 * needs more than counts, it gets them here rather than in the template.
 */
function toViewer(user, avatarRow, stats) {
  const a = avatarRow || STARTER_AVATAR;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    joined: String(user.created_at || '').slice(0, 10),
    lastOnline: user.last_seen_at || user.created_at,
    online: true,
    description: user.description || '',
    avatar: {
      head: a.head,
      torso: a.torso,
      leftArm: a.left_arm,
      rightArm: a.right_arm,
      leftLeg: a.left_leg,
      rightLeg: a.right_leg,
      face: a.face,
    },
    currency: { bucks: user.bucks, tickets: user.tickets },
    stats: stats || { friends: 0, badges: 0, games: 0, items: 0 },
  };
}

/** A viewer object with real counts, for the pages that show them. */
async function loadViewer(db, user) {
  if (!user) return null;

  const avatar = await db.prepare('SELECT * FROM avatars WHERE user_id = ?').bind(user.id).first();

  const [badges, games, items, friendships] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS n FROM user_badges WHERE user_id = ?').bind(user.id).first(),
    db.prepare('SELECT COUNT(*) AS n FROM games WHERE creator_id = ? AND published = 1').bind(user.id).first(),
    db.prepare('SELECT COUNT(*) AS n FROM user_items WHERE user_id = ?').bind(user.id).first(),
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM friendships
          WHERE status = 'accepted' AND (user_a = ? OR user_b = ?)`
      )
      .bind(user.id, user.id)
      .first(),
  ]);

  return toViewer(user, avatar, {
    friends: friendships ? friendships.n : 0,
    badges: badges ? badges.n : 0,
    games: games ? games.n : 0,
    items: items ? items.n : 0,
  });
}

module.exports = {
  AccountError,
  SESSION_DAYS,
  STARTER_AVATAR,
  activeRestriction,
  authenticate,
  createSession,
  destroySession,
  findByUsername,
  loadViewer,
  register,
  toViewer,
  touchSession,
  userForToken,
  validate,
};
