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
      adminNav: adminService.nav(req.admin.role, req.path),
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
    })();
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

module.exports = router;
