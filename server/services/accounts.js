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
// The one place the session cookie's name is written down; the routes read it.
const SESSION_COOKIE = 'fb_session';
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

/**
 * Birthday and gender, checked together.
 *
 * Called by the sign-up route rather than by register(), so tooling can still
 * create an account without them. The rules are real: a date that does not exist
 * is refused instead of stored, so the 31st of a 30-day month is rejected.
 *
 * @returns {{month: number, day: number, year: number, gender: string}}
 */
function validateProfile(input) {
  const body = input || {};
  const rawMonth = String(body.birthMonth === undefined ? '' : body.birthMonth).trim();
  const rawDay = String(body.birthDay === undefined ? '' : body.birthDay).trim();
  const rawYear = String(body.birthYear === undefined ? '' : body.birthYear).trim();
  const gender = String(body.gender || '').trim().toLowerCase();

  if (!rawMonth || !rawDay || !rawYear) {
    throw new AccountError('Choose your birthday: month, day and year.');
  }

  const month = Number(rawMonth);
  const day = Number(rawDay);
  const year = Number(rawYear);
  const thisYear = new Date().getUTCFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AccountError('That is not a real month.');
  }

  if (!Number.isInteger(year) || year < 1900 || year > thisYear) {
    throw new AccountError('That is not a real year.');
  }

  // Day 0 of the next month is the last day of this one, which handles February
  // and leap years without carrying a table around.
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (!Number.isInteger(day) || day < 1 || day > lastDay) {
    throw new AccountError('That day does not exist in that month.');
  }

  if (gender !== 'male' && gender !== 'female') {
    throw new AccountError('Choose a gender.');
  }

  return { month, day, year, gender };
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

  // Birthday and gender, when the caller has already checked them. Optional
  // here so tooling can still create an account; the sign-up route insists.
  if (input.profile) {
    await db
      .prepare(
        `INSERT INTO user_profiles (user_id, birth_month, birth_day, birth_year, gender)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(userId, input.profile.month, input.profile.day, input.profile.year, input.profile.gender)
      .run();
  }

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

const LAST_SEEN_INTERVAL_MS = 60 * 1000;

/**
 * Records that this account was here, at most once a minute.
 *
 * Presence has to be written by the request that was signed in, not inferred
 * from a session's creation time: a session lasts a fortnight, so "created a
 * session recently" says nothing about whether anybody is here now. The
 * interval keeps it to one small write per member per minute rather than one
 * per request.
 */
async function touchLastSeen(db, user) {
  if (!db || !user || !user.id) return;

  const last = Date.parse(user.last_seen_at || '') || 0;
  if (Date.now() - last < LAST_SEEN_INTERVAL_MS) return;

  const now = nowIso();
  await db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(now, user.id).run();
  user.last_seen_at = now;
}

/** Sessions that have not expired. The current device is one of them. */
async function activeSessionCount(db, userId) {
  const row = await db
    .prepare('SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND expires_at > ?')
    .bind(userId, nowIso())
    .first();

  return row ? Number(row.n) : 0;
}

function storedSecret(row) {
  return {
    hash: row.password_hash,
    salt: row.password_salt,
    iterations: row.password_iterations,
  };
}

/**
 * Changes the password, ending every other session.
 *
 * The device that made the change stays signed in, because forcing somebody to
 * sign straight back in on the screen they are already using only encourages
 * them to skip changing the password. Any other token is deleted, which is the
 * point of changing it at all after a scare.
 */
async function changePassword(db, userId, input, keepToken) {
  const body = input || {};
  const current = String(body.current || '');
  const next = String(body.password || '');
  const confirm = body.confirm === undefined ? next : String(body.confirm || '');

  if (next.length < MIN_PASSWORD) {
    throw new AccountError(`A password needs at least ${MIN_PASSWORD} characters.`);
  }
  if (next !== confirm) {
    throw new AccountError('The two passwords do not match.');
  }
  if (next === current) {
    throw new AccountError('That is already your password.');
  }

  const row = await findById(db, userId);
  if (!row) throw new AccountError('That account no longer exists.');

  const ok = await passwords.verify(current, storedSecret(row));
  if (!ok) throw new AccountError('That is not your current password.');

  const secret = await passwords.hash(next);

  await db
    .prepare('UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ? WHERE id = ?')
    .bind(secret.hash, secret.salt, secret.iterations, userId)
    .run();

  return signOutOtherSessions(db, userId, keepToken);
}

/** Ends every session except the one making the request. */
async function signOutOtherSessions(db, userId, keepToken) {
  const keepHash = keepToken ? await passwords.hashToken(keepToken) : null;

  const result = keepHash
    ? await db
        .prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?')
        .bind(userId, keepHash)
        .run()
    : await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();

  return result && result.meta ? Number(result.meta.changes) || 0 : 0;
}

/**
 * Closes the account: marked closed rather than deleted, so history survives.
 * Every auth query filters on closed_at, so the name stops working immediately.
 * The close is written to the moderation log, which is append-only, because
 * "where did this account go" should be answerable later.
 */
async function closeAccount(db, userId, input) {
  const password = String((input || {}).password || '');
  const row = await findById(db, userId);
  if (!row) throw new AccountError('That account no longer exists.');

  const ok = await passwords.verify(password, storedSecret(row));
  if (!ok) throw new AccountError('That is not your password.');

  const now = nowIso();

  await db.prepare('UPDATE users SET closed_at = ? WHERE id = ?').bind(now, userId).run();
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  await db
    .prepare(
      `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
       VALUES (?, ?, 'account_closed', 'Closed by the account holder.', ?)`
    )
    .bind(userId, userId, now)
    .run();

  return { closedAt: now };
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

  // The staff role travels with the viewer so the top bar can decide whether to
  // draw its Admin link. The floor is rank 100 (Developer and up); the rank is
  // read from the role table, never taken from a cookie or a form.
  const role = await db
    .prepare(
      `SELECT r.rank
         FROM user_roles ur
         JOIN roles r ON r.key = ur.role_key
        WHERE ur.user_id = ?`
    )
    .bind(user.id)
    .first();

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

  const viewer = toViewer(user, avatar, {
    friends: friendships ? friendships.n : 0,
    badges: badges ? badges.n : 0,
    games: games ? games.n : 0,
    items: items ? items.n : 0,
  });

  viewer.staffRank = role ? Number(role.rank) || 0 : 0;

  return viewer;
}

module.exports = {
  AccountError,
  SESSION_COOKIE,
  SESSION_DAYS,
  STARTER_AVATAR,
  activeRestriction,
  activeSessionCount,
  authenticate,
  changePassword,
  closeAccount,
  createSession,
  destroySession,
  findByUsername,
  loadViewer,
  register,
  signOutOtherSessions,
  toViewer,
  touchLastSeen,
  touchSession,
  userForToken,
  validate,
  validateProfile,
};
