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

/** Result of a role change, looked up from a fixed code rather than the URL. */
const DONE = {
  role: 'Role changed.',
};

const FAILED = {
  self: 'You cannot change your own role.',
  rank: 'That account is at or above your own rank, so you cannot act on it.',
  grant: 'Your role cannot grant that role.',
  unknown: 'That is not a role in the ladder.',
  nobody: 'No account has that ID.',
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

module.exports = router;
