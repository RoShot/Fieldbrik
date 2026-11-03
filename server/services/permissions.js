/**
 * Staff permissions.
 *
 * Two questions, deliberately separate:
 *
 *   can(role, capability)   what this role is allowed to do
 *   mayActOn(actor, target) who it is allowed to do it to
 *
 * Rank alone would let a moderator ban an administrator, so every action page
 * asks both. Ranks are read from the database on each request; nothing here
 * trusts a role that arrived in a cookie or a form.
 */

/** Intern. Below this is an ordinary member. */
const MIN_STAFF = 50;

/**
 * Minimum rank per capability.
 *
 * A missing capability is not "allow" - `can` returns false for an action that
 * was never priced, so a new page has to state its rank before it works.
 */
const CAPABILITIES = {
  'admin.open': 50,
  'users.search': 50,
  'users.view': 50,
  'users.notice': 150,
  'users.warn': 160,
  'users.restrict': 160,
  'users.ban.short': 190,
  'users.ban.permanent': 200,
  'users.ban.poison': 240,
  'users.scrub': 190,
  'users.delete': 230,
  'users.role': 230,
  'users.blacklist_email': 230,
  // Handing out a badge. Senior Moderator and above: the operator described the
  // staff award badge as a Senior Mod+ decision.
  'users.badge': 200,
  'club.grant': 220,
  'users.referral': 220,
  'billing.issue': 220,
  'content.review': 170,
  'forum.moderate': 180,
  'settings.write': 240,
  'log.view': 100,
};

/** The role ladder, as the operator specified it. Seed mirrors this list. */
const ROLES = [
  { key: 'intern', name: 'Intern', rank: 50, description: 'Staff trainee.' },
  { key: 'developer', name: 'Developer', rank: 100, description: 'Platform development.' },
  { key: 'support_rep', name: 'Support Rep', rank: 150, description: 'Customer support.' },
  { key: 'support_admin', name: 'Support Admin', rank: 160, description: 'Advanced account support.' },
  { key: 'image_moderator', name: 'Image Moderator', rank: 170, description: 'Asset and image approval.' },
  { key: 'forum_moderator', name: 'Forum Moderator', rank: 180, description: 'Forum moderation.' },
  { key: 'moderator', name: 'Moderator', rank: 190, description: 'General moderation.' },
  { key: 'senior_moderator', name: 'Senior Moderator', rank: 200, description: 'Experienced moderation staff.' },
  { key: 'super_moderator', name: 'Super Moderator', rank: 210, description: 'Oversees the moderators.' },
  { key: 'junior_administrator', name: 'Junior Administrator', rank: 220, description: 'Trial administrator.' },
  { key: 'senior_administrator', name: 'Senior Administrator', rank: 230, description: 'Experienced administrator.' },
  { key: 'administrator', name: 'Administrator', rank: 240, description: 'Administers the platform.' },
  { key: 'super_administrator', name: 'Super Administrator', rank: 250, description: 'Subordinate to Root only.' },
  { key: 'root', name: 'Root', rank: 255, description: 'Founder account.' },
];

/** A member: no role row, no panel access, rank 0. */
const MEMBER = { key: 'user', name: 'Member', rank: 0, description: 'An ordinary account.' };

/**
 * The role held by an account, or null.
 *
 * Null means "not staff", which is not the same as "no role" in the database:
 * most accounts have no row here at all, and that is the normal case.
 */
async function roleOf(db, userId) {
  if (!db || !userId) return null;

  const row = await db
    .prepare(
      `SELECT r.key, r.name, r.rank, r.description
         FROM user_roles ur
         JOIN roles r ON r.key = ur.role_key
        WHERE ur.user_id = ?`
    )
    .bind(userId)
    .first();

  if (!row) return null;

  return { key: row.key, name: row.name, rank: Number(row.rank) || 0, description: row.description || '' };
}

/** Every role, lowest rank first. Used by the role picker. */
function list(db) {
  return db
    .prepare('SELECT key, name, rank, description FROM roles ORDER BY rank ASC')
    .all()
    .then((result) => (result.results || []).map((row) => ({ ...row, rank: Number(row.rank) || 0 })));
}

/** Does this role reach the given capability? Unknown capability means no. */
function can(role, capability) {
  if (!role) return false;
  const minimum = CAPABILITIES[capability];
  if (minimum === undefined) return false;
  return Number(role.rank) >= minimum;
}

/**
 * May the actor act on the target?
 *
 * Never on yourself, and never on somebody at or above your own rank - which is
 * what stops a moderator touching an administrator, and what stops anybody
 * touching Root except Root.
 */
function mayActOn(actor, target) {
  if (!actor || !target) return false;
  const actorRank = Number(actor.rank) || 0;
  const targetRank = Number(target.rank) || 0;
  if (actor.id && target.id && String(actor.id) === String(target.id)) return false;
  return actorRank > targetRank;
}

/**
 * May the actor hand out this role?
 *
 * Root is grantable by Root alone; Super Administrator stops at 249; everybody
 * else can only grant below themselves.
 */
function mayGrant(actor, role) {
  if (!actor || !role) return false;
  const own = Number(actor.rank) || 0;
  const wanted = Number(role.rank) || 0;
  if (wanted >= 255) return own >= 255;
  if (own >= 250) return wanted < 250;
  return wanted < own;
}

module.exports = {
  CAPABILITIES,
  MEMBER,
  MIN_STAFF,
  ROLES,
  can,
  list,
  mayActOn,
  mayGrant,
  roleOf,
};
