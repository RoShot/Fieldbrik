/**
 * Admin panel routes.
 *
 * Every admin route is registered through `staff()`, which is where the gate
 * lives. It is a route handler rather than a middleware on purpose: the Worker
 * only waits for a promise returned by a route (`req.pending`), so an async
 * middleware would let the request fall through to the 404 page before the role
 * lookup finished. Registering through `staff()` also means a page cannot be
 * added without a rank attached to it.
 *
 * Rank is read from the database on every request. Nothing about a role is taken
 * from the cookie, so a demotion lands on the account's next click.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const permissions = require('../services/permissions');
const adminService = require('../services/admin');
const moderation = require('../services/moderation');
const clubService = require('../services/club');
const referralService = require('../services/referrals');
const blacklistService = require('../services/blacklist');

const router = Router();

function notAllowed(req, res, code, message) {
  return res.status(code).render(
    'pages/error',
    pageContext(req, { pageTitle: 'Not allowed', statusCode: code, message })
  );
}

/**
 * Wraps an admin page in the gate.
 *
 * @param {string} capability capability the page needs, or null for "any staff"
 * @param {function} handler  (req, res) => void, with req.admin.role set
 */
function staff(capability, handler) {
  return function guarded(req, res, next) {
    return (async () => {
      if (!req.viewer) return res.redirect('/login');

      if (!req.db) {
        return notAllowed(
          req,
          res,
          503,
          'The administration panel needs the database, which is not attached in this runtime.'
        );
      }

      const role = await permissions.roleOf(req.db, req.viewer.id);

      if (!role || role.rank < permissions.MIN_STAFF) {
        return notAllowed(
          req,
          res,
          403,
          'This area is for FieldBrik staff. If you believe you should have access, contact a member of the team.'
        );
      }

      if (capability && !permissions.can(role, capability)) {
        return notAllowed(req, res, 403, 'Your role cannot open this page.');
      }

      req.admin = { role };
      return handler(req, res);
    })().catch(next);
  };
}

/**
 * The rank rule for an account-scoped panel: never yourself, never somebody at
 * or above your own rank. The club and referral pages both need it.
 */
function mayTouch(req, account) {
  return permissions.mayActOn(
    { id: req.viewer.id, rank: req.admin.role.rank },
    { id: account.id, rank: account.roleRank }
  );
}

/** Locals every admin page needs. Passed explicitly - a missing local throws. */
function view(req, extra) {
  return Object.assign(
    {
      site,
      viewer: req.viewer,
      admin: req.admin.role,
      currentPath: req.path,
      adminNav: adminService.nav(req.admin.role, req.path, req.query),
      pageTitle: 'Administration - FieldBrik',
    },
    extra || {}
  );
}

router.get(
  '/admin',
  staff('admin.open', (req, res) => {
    return (async () => {
      const overview = await adminService.overview(req.db);
      return res.render(
        'admin/home',
        view(req, { adminStatus: overview.status, counts: overview.counts })
      );
    })().catch((error) => {
      throw error;
    });
  })
);

router.get(
  '/admin/logs',
  staff('log.view', (req, res) => {
    return (async () => {
      const [entries, overview] = await Promise.all([
        adminService.recentLog(req.db, 100),
        adminService.overview(req.db),
      ]);

      return res.render('admin/logs', view(req, { adminStatus: overview.status, entries }));
    })();
  })
);

/** Result of an action or a role change, looked up from a fixed code. */
const DONE = {
  role: 'Role changed.',
  remind: 'Reminder sent.',
  warn: 'Warning issued.',
  ban_1d: 'Banned for 1 day.',
  ban_3d: 'Banned for 3 days.',
  ban_7d: 'Banned for 7 days.',
  ban_14d: 'Banned for 14 days.',
  ban_permanent: 'Banned permanently.',
  delete: 'Account deleted.',
  poison: 'Poison ban applied: banned, scrubbed, email blacklisted, content removed.',
  note: 'Note saved.',
  unban: 'Restriction lifted.',
  club_granted: 'Membership granted.',
  club_ended: 'Membership ended.',
  referral_granted: 'Referral granted: 15 Bucks and the Referral badge.',
  blacklist_added: 'Email address blacklisted.',
  blacklist_removed: 'Email address removed from the blacklist.',
};

const FAILED = {
  self: 'You cannot change your own role.',
  rank: 'That account is at or above your own rank, so you cannot act on it.',
  grant: 'Your role cannot grant that role.',
  unknown: 'That is not an action or role the panel knows.',
  nobody: 'No account has that ID.',
  cap: 'Your role cannot do that.',
  noreason: 'A reason is required for that action.',
  nonote: 'A note is required to save a note.',
  badimage: 'Evidence must be a png, jpeg, webp or gif image.',
  toobig: 'That image is larger than 128 KB.',
  tier: 'That is not a Carpenters Club tier.',
  term: 'That is not a billing term.',
  club: 'No membership with that id is on this account.',
  already: 'That account has already been referred by somebody.',
  self_referral: 'An account cannot refer itself.',
  atcap: 'This account has already reached the referral cap of 10.',
  bademail: 'That does not look like an email address.',
  nobreaklist: 'That address is not on the blacklist.',
};

function noticeFor(query) {
  if (query && DONE[query.done]) return DONE[query.done];
  if (query && FAILED[query.failed]) return FAILED[query.failed];
  return '';
}

router.get(
  '/admin/users',
  staff('users.search', (req, res) => {
    return (async () => {
      const query = String(req.query.q || '').trim();
      const staffOnly = String(req.query.staff || '') === '1';

      const [accounts, overview] = await Promise.all([
        adminService.searchAccounts(req.db, { q: query, staff: staffOnly }),
        adminService.overview(req.db),
      ]);

      return res.render(
        'admin/users',
        view(req, {
          adminStatus: overview.status,
          accounts,
          query,
          staffOnly,
          notice: noticeFor(req.query),
        })
      );
    })();
  })
);

router.get(
  '/admin/users/:id',
  staff('users.view', (req, res) => {
    return (async () => {
      const account = await adminService.findAccount(req.db, req.params.id);

      if (!account) {
        return notAllowed(req, res, 404, 'No account has that ID.');
      }

      const [record, overview, roles] = await Promise.all([
        adminService.accountRecord(req.db, account.id),
        adminService.overview(req.db),
        permissions.can(req.admin.role, 'users.role') ? permissions.list(req.db) : Promise.resolve([]),
      ]);

      const actor = { id: req.viewer.id, rank: req.admin.role.rank };
      const rootOverRoot = actor.rank === 255 && account.roleRank === 255;
      const aboveOrEqual = account.roleRank >= actor.rank && !rootOverRoot;

      const canChangeRole =
        permissions.can(req.admin.role, 'users.role') &&
        String(account.id) !== String(actor.id) &&
        !aboveOrEqual;

      let roleReason = 'Your role cannot change roles at all.';

      if (permissions.can(req.admin.role, 'users.role')) {
        if (String(account.id) === String(actor.id)) {
          roleReason = 'You cannot change your own role.';
        } else if (aboveOrEqual) {
          roleReason = 'That account is at or above your own rank.';
        }
      }

      return res.render(
        'admin/user',
        view(req, {
          adminStatus: overview.status,
          account,
          record,
          notice: noticeFor(req.query),
          canChangeRole,
          // Warnings are the lowest moderation action, so any role that can warn
          // can open the page; the page itself only draws the actions that rank
          // is allowed to use.
          canModerate: permissions.can(req.admin.role, 'users.warn'),
          canClub: permissions.can(req.admin.role, 'club.grant'),
          canReferral: permissions.can(req.admin.role, 'users.referral'),
          roleReason,
          roleOptions: roles.filter((role) => permissions.mayGrant(req.admin.role, role)),
        })
      );
    })();
  })
);

router.post(
  '/admin/users/:id/role',
  staff('users.role', (req, res) => {
    return (async () => {
      const body = req.body || {};
      const targetId = Number(req.params.id) || 0;

      const result = await adminService.setRole(
        req.db,
        { id: req.viewer.id, rank: req.admin.role.rank },
        targetId,
        body.role,
        new Date().toISOString()
      );

      if (!result.ok) {
        return res.redirect(`/admin/users/${targetId}?failed=${encodeURIComponent(result.code)}`);
      }

      return res.redirect(`/admin/users/${targetId}?done=role`);
    })();
  })
);

router.get(
  '/admin/users/:id/moderate',
  staff('users.view', (req, res) => {
    return (async () => {
      const account = await adminService.findAccount(req.db, req.params.id);

      if (!account) {
        return notAllowed(req, res, 404, 'No account has that ID.');
      }

      const [overview, restrictions, noteList, scrubbedFrom] = await Promise.all([
        adminService.overview(req.db),
        moderation.history(req.db, account.id),
        moderation.notes(req.db, account.id),
        moderation.originalUsernameFor(req.db, account.id),
      ]);

      // The same two rules the server checks on the action itself. Drawn this
      // way so the page cannot invite an action that will be refused.
      const canAct =
        String(account.id) !== String(req.viewer.id) && account.roleRank < req.admin.role.rank;

      return res.render(
        'admin/moderate',
        view(req, {
          adminStatus: overview.status,
          account,
          restrictions,
          notes: noteList,
          actions: moderation.available(req.admin.role),
          presets: moderation.PRESETS,
          notice: noticeFor(req.query),
          scrubbedFrom,
          canAct,
        })
      );
    })();
  })
);

router.post(
  '/admin/users/:id/action',
  staff('users.view', (req, res) => {
    return (async () => {
      const body = req.body || {};
      const targetId = Number(req.params.id) || 0;

      const result = await moderation.apply(req.db, {
        actor: { id: req.viewer.id, rank: req.admin.role.rank },
        targetId,
        action: body.action,
        reason: body.reason,
        note: body.note,
        scrub: Boolean(body.scrub),
        evidence: body.evidence || null,
      });

      if (!result.ok) {
        return res.redirect(
          `/admin/users/${targetId}/moderate?failed=${encodeURIComponent(result.code)}`
        );
      }

      // A closed account has no page of its own left to return to.
      if (result.code === 'delete') {
        return res.redirect('/admin/users?done=delete');
      }

      return res.redirect(`/admin/users/${targetId}/moderate?done=${encodeURIComponent(result.code)}`);
    })();
  })
);

// ---------- Carpenters Club ----------
//
// Viewing a membership is part of looking at an account, so the page is gated at
// users.view and the form is drawn only for a role that can grant. The POST is
// gated at club.grant, because the form is only a rendering of that rule.

router.get(
  '/admin/users/:id/club',
  staff('users.view', (req, res) => {
    return (async () => {
      const account = await adminService.findAccount(req.db, req.params.id);
      if (!account) return notAllowed(req, res, 404, 'No account has that ID.');

      const [overview, memberships] = await Promise.all([
        adminService.overview(req.db),
        clubService.list(req.db, account.id),
      ]);

      return res.render(
        'admin/club',
        view(req, {
          adminStatus: overview.status,
          account,
          memberships,
          tiers: site.carpentersClub.tiers,
          terms: site.carpentersClub.terms,
          canGrant: mayTouch(req, account) && permissions.can(req.admin.role, 'club.grant'),
          notice: noticeFor(req.query),
        })
      );
    })();
  })
);

router.post(
  '/admin/users/:id/club',
  staff('club.grant', (req, res) => {
    return (async () => {
      const targetId = Number(req.params.id) || 0;
      const account = await adminService.findAccount(req.db, targetId);
      if (!account) return res.redirect('/admin/users?failed=nobody');
      if (!mayTouch(req, account)) return res.redirect(`/admin/users/${targetId}/club?failed=rank`);

      const body = req.body || {};
      const actor = { id: req.viewer.id, rank: req.admin.role.rank };

      const result =
        String(body.action) === 'end'
          ? await clubService.end(req.db, {
              membershipId: Number(body.membership) || 0,
              userId: targetId,
              actor,
            })
          : await clubService.grant(req.db, {
              userId: targetId,
              tier: body.tier,
              term: body.term,
              note: body.note,
              actor,
            });

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/users/${targetId}/club?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

// ---------- Referral Program ----------

router.get(
  '/admin/users/:id/referral',
  staff('users.view', (req, res) => {
    return (async () => {
      const account = await adminService.findAccount(req.db, req.params.id);
      if (!account) return notAllowed(req, res, 404, 'No account has that ID.');

      const [overview, entries, used] = await Promise.all([
        adminService.overview(req.db),
        referralService.list(req.db, account.id),
        referralService.count(req.db, account.id),
      ]);

      return res.render(
        'admin/referral',
        view(req, {
          adminStatus: overview.status,
          account,
          referrals: entries,
          used,
          cap: referralService.CAP,
          reward: referralService.REWARD_BUCKS,
          canGrant: mayTouch(req, account) && permissions.can(req.admin.role, 'users.referral'),
          notice: noticeFor(req.query),
        })
      );
    })();
  })
);

router.post(
  '/admin/users/:id/referral',
  staff('users.referral', (req, res) => {
    return (async () => {
      const targetId = Number(req.params.id) || 0;
      const account = await adminService.findAccount(req.db, targetId);
      if (!account) return res.redirect('/admin/users?failed=nobody');
      if (!mayTouch(req, account)) return res.redirect(`/admin/users/${targetId}/referral?failed=rank`);

      const body = req.body || {};
      const referred = await referralService.resolveAccount(req.db, body.referred);

      if (!referred) return res.redirect(`/admin/users/${targetId}/referral?failed=nobody`);

      const result = await referralService.grant(req.db, {
        referrerId: account.id,
        referredId: referred.id,
        actor: { id: req.viewer.id, rank: req.admin.role.rank },
      });

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/users/${targetId}/referral?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

// ---------- Email blacklist ----------

router.get(
  '/admin/blacklist',
  staff('users.blacklist_email', (req, res) => {
    return (async () => {
      const [overview, entries] = await Promise.all([
        adminService.overview(req.db),
        blacklistService.list(req.db),
      ]);

      return res.render(
        'admin/blacklist',
        view(req, { adminStatus: overview.status, entries, notice: noticeFor(req.query) })
      );
    })();
  })
);

router.post(
  '/admin/blacklist',
  staff('users.blacklist_email', (req, res) => {
    return (async () => {
      const body = req.body || {};
      const actor = { id: req.viewer.id, rank: req.admin.role.rank };

      const result =
        String(body.action) === 'remove'
          ? await blacklistService.remove(req.db, { email: body.email, actor })
          : await blacklistService.add(req.db, { email: body.email, reason: body.reason, actor });

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/blacklist?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

module.exports = router;
