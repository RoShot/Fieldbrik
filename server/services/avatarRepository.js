/**
 * Avatar appearance, stored in D1.
 *
 * This replaces the phase 1 in-memory store, which wrote onto the fixture user
 * objects: it survived navigation but not a restart, and once real accounts
 * existed it was writing to the wrong member entirely.
 *
 * The table has one row per account, created at registration, so a save is an
 * update. The insert path stays as a safety net for an account that somehow has
 * no row yet.
 *
 * Validation lives here and not in the route, so an appearance cannot be
 * written by any path that skips it. The columns match the client renderer
 * exactly: six independent colours and one face ID (DECISIONS D19).
 */

const FACE_IDS = [
  'classic-smile',
  'chuckle',
  'silly',
  'durr',
  'oo',
  'glee',
  'notamused',
  'meh',
];

const COLOUR_FIELDS = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

class AvatarError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AvatarError';
    this.statusCode = 400;
  }
}

function defaults() {
  return {
    head: '#ffcc00',
    torso: '#f57c00',
    leftArm: '#111111',
    rightArm: '#111111',
    leftLeg: '#111111',
    rightLeg: '#111111',
    face: 'classic-smile',
  };
}

/** Database columns to the names the templates and renderer use. */
function fromRow(row) {
  if (!row) return defaults();

  return {
    head: row.head,
    torso: row.torso,
    leftArm: row.left_arm,
    rightArm: row.right_arm,
    leftLeg: row.left_leg,
    rightLeg: row.right_leg,
    face: row.face,
  };
}

async function get(db, userId) {
  const row = await db
    .prepare('SELECT head, torso, left_arm, right_arm, left_leg, right_leg, face FROM avatars WHERE user_id = ?')
    .bind(userId)
    .first();

  return fromRow(row);
}

/**
 * Applies a partial appearance on top of the current one.
 *
 * Only known fields are read out of the patch; anything else is ignored rather
 * than stored, so a client cannot smuggle extra keys onto the record.
 */
function merge(current, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new AvatarError('Expected an object of appearance values.');
  }

  const next = { ...current };
  let changed = 0;

  for (const field of COLOUR_FIELDS) {
    if (!(field in patch)) continue;

    const value = patch[field];

    if (typeof value !== 'string' || !HEX_COLOUR.test(value)) {
      throw new AvatarError(`"${field}" must be a colour like "#ffcc00".`);
    }

    next[field] = value.toLowerCase();
    changed += 1;
  }

  if ('face' in patch) {
    if (typeof patch.face !== 'string' || !FACE_IDS.includes(patch.face)) {
      throw new AvatarError('That face does not exist.');
    }

    next.face = patch.face;
    changed += 1;
  }

  if (changed === 0) {
    throw new AvatarError('No appearance values were supplied.');
  }

  return next;
}

async function save(db, userId, patch) {
  const current = await get(db, userId);
  const next = merge(current, patch);
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `UPDATE avatars
          SET head = ?, torso = ?, left_arm = ?, right_arm = ?,
              left_leg = ?, right_leg = ?, face = ?, updated_at = ?
        WHERE user_id = ?`
    )
    .bind(
      next.head,
      next.torso,
      next.leftArm,
      next.rightArm,
      next.leftLeg,
      next.rightLeg,
      next.face,
      now,
      userId
    )
    .run();

  if (!result.meta || !result.meta.changes) {
    await db
      .prepare(
        `INSERT INTO avatars
           (user_id, head, torso, left_arm, right_arm, left_leg, right_leg, face)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(userId, next.head, next.torso, next.leftArm, next.rightArm, next.leftLeg, next.rightLeg, next.face)
      .run();
  }

  return next;
}

module.exports = {
  AvatarError,
  COLOUR_FIELDS,
  FACE_IDS,
  defaults,
  fromRow,
  get,
  merge,
  save,
};
