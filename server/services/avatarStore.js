/**
 * Avatar appearance store.
 *
 * TRANSITIONAL. This holds appearance in the running process and writes it back
 * onto the fixture user objects, so every page sees a change immediately and it
 * survives navigation and reloads - but it resets when the server restarts, and
 * there is one shared appearance for everybody because there are no accounts
 * yet.
 *
 * This exists so the Character editor can do something real now instead of
 * pretending. In Phase 2 it is replaced by a D1-backed repository with the same
 * three functions, and the routes and templates do not change:
 *
 *   get(userId)          -> avatar object
 *   save(userId, patch)  -> avatar object (throws AvatarError on bad input)
 *   defaults()           -> the starter appearance
 *
 * The columns match the client renderer exactly: six independent colours, one
 * face ID, and no texture paths (see DECISIONS D19).
 */

const fixtures = require('./fixtures');

const HEX_COLOUR = /^#[0-9a-f]{6}$/i;

// Must stay in step with FACE_TEXTURES in public/avatar/avatar.js.
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

const COLOUR_FIELDS = [
  'head',
  'torso',
  'leftArm',
  'rightArm',
  'leftLeg',
  'rightLeg',
];

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

function findUser(userId) {
  return fixtures.users.find((user) => user.id === userId) || null;
}

function get(userId) {
  const user = findUser(userId);
  return user ? user.avatar : null;
}

/**
 * Validate and apply a partial appearance.
 *
 * Only known fields are accepted; anything else is ignored rather than stored,
 * so a client cannot smuggle extra keys onto the record.
 */
function save(userId, patch) {
  const user = findUser(userId);

  if (!user) {
    throw new AvatarError('That member does not exist.');
  }

  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new AvatarError('Expected an object of appearance values.');
  }

  const next = {};

  for (const field of COLOUR_FIELDS) {
    if (!(field in patch)) {
      continue;
    }

    const value = patch[field];

    if (typeof value !== 'string' || !HEX_COLOUR.test(value)) {
      throw new AvatarError(`"${field}" must be a colour like "#ffcc00".`);
    }

    next[field] = value.toLowerCase();
  }

  if ('face' in patch) {
    if (typeof patch.face !== 'string' || !FACE_IDS.includes(patch.face)) {
      throw new AvatarError('That face does not exist.');
    }

    next.face = patch.face;
  }

  if (Object.keys(next).length === 0) {
    throw new AvatarError('No appearance values were supplied.');
  }

  Object.assign(user.avatar, next);

  return user.avatar;
}

module.exports = {
  AvatarError,
  COLOUR_FIELDS,
  FACE_IDS,
  defaults,
  get,
  save,
};
