/**
 * Abuse reports: the form a member uses, their own list, and the staff queue.
 *
 * The queue lives at /admin/reports and is mounted before routes/admin.js, which
 * knows nothing about reports. The gate below repeats the five checks the rest of
 * the panel applies - the policy it reads is services/permissions, shared with
 * the panel, so only the plumbing for drawing a refusal is repeated.
 *
 * A reporter never sees the queue: GET /reports/mine is scoped by reporter_id in
 * the query, and the staff pages ask permissions for a capability rather than
 * trusting anything from the form.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const permissions = require('../services/permissions');
const adminService = require('../services/admin');
const reports = require('../services/reports');

const router = Router();

/** Reports are moderation work: Support Admin and above. */
const CAP = 'reports.review';

const DONE = {
  reported: 'Report sent. It is in the moderation queue.',
  handled: 'Report marked as handled.',
  dismissed: 'Report dismissed.',
};

const FAILED = {
  kind: 'That is not something that can be reported.',
  reason: 'Choose a reason from the list.',
  detail: `The explanation can be up to ${reports.DETAIL_MAX} characters.`,
  no_member: 'There is no member by that name.',
  self: 'You cannot report yourself.',
  no_message: 'That message is not one you were sent.',
  already: 'You already have an open report about that.',
  action: 'That is not an action this queue knows.',
  closed: 'That report has already been closed.',
  noreport: 'That report does not exist.',
  rank: 'Your role cannot close reports.',
  refused: 'The report was not saved.',
};

function noticeFor(query) {
  const done = DONE[String((query || {}).done || '')];
  if (done) return done;

  const failed = String((query || {}).failed || '');
  if (!failed) return null;

  return FAILED[failed] || FAILED.refused;
}

/** A signed-in member, or an answer that explains why not. */
function ready(req, res) {
  if (!req.viewer) {
    res.redirect('/login');
    return false;
  }

  if (!req.db) {
    res.status(503).render(
      'pages/error',
      pageContext(req, {
        pageTitle: `Reports unavailable - ${site.name}`,
        statusCode: 503,
        message: 'Reports need the database, and this server was started without one.',
      })
    );
    return false;
  }

  return true;
}

function notAllowed(req, res, code, message) {
  return res.status(code).render(
    'pages/error',
    pageContext(req, { pageTitle: 'Not allowed', statusCode: code, message })
  );
}

/**
 * The panel gate, as a route handler rather than a middleware.
 *
 * The Worker only waits on a promise a route returns, so an async middleware
 * would let the request fall through to the 404 page before the gate answered.
 */
function staffOnly(handler) {
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

      if (!permissions.can(role, CAP)) return notAllowed(req, res, 403, 'Your role cannot open this page.');

      req.admin = { role };
      return handler(req, res);
    })().catch(next);
  };
}

// ---------- The member's side ----------

/**
 * The report form.
 *
 * The target is read from the query and then looked up in the database, so the
 * page can show who is being reported rather than a bare id. A message report
 * only resolves when the message was addressed to this member.
 */
router.get('/reports/new', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const kind = String(req.query.kind || 'member');
    if (!reports.KINDS.includes(kind)) return res.redirect('/reports/mine');

    let target = null;
    let message = null;

    if (kind === 'message') {
      const id = Number(req.query.id) || 0;

      const row = id
        ? await req.db
            .prepare(
              `SELECT m.id, m.subject, s.username AS sender, s.id AS sender_id
                 FROM messages m JOIN users s ON s.id = m.from_id
                WHERE m.id = ? AND m.to_id = ?`
            )
            .bind(id, req.viewer.id)
            .first()
        : null;

      if (!row) {
        return res.redirect('/messages?failed=gone');
      }

      message = { id: Number(row.id), subject: row.subject || '(no subject)' };
      target = { id: Number(row.sender_id), username: row.sender };
    } else {
      const username = String(req.query.user || '').trim();

      const row = username
        ? await req.db
            .prepare('SELECT id, username FROM users WHERE username_lower = ? AND closed_at IS NULL')
            .bind(username.toLowerCase())
            .first()
        : null;

      if (!row) {
        return res.status(404).render(
          'pages/error',
          pageContext(req, {
            pageTitle: `Member not found - ${site.name}`,
            statusCode: 404,
            message: 'There is no member by that name to report.',
          })
        );
      }

      target = { id: Number(row.id), username: row.username };
    }

    if (target.id === req.viewer.id) return res.redirect('/reports/mine?failed=self');

    return res.render(
      'pages/report-new',
      pageContext(req, {
        pageTitle: `Report ${target.username} - ${site.name}`,
        authState: 'member',
        kind,
        kindLabel: reports.KIND_LABELS[kind],
        target,
        message,
        reasons: reports.REASONS,
        failure: FAILED[String(req.query.failed || '')] || null,
        notice: noticeFor(req.query),
      })
    );
  })().catch(next);
});

router.post('/reports', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const body = req.body || {};
    const kind = String(body.kind || 'member');

    const result = await reports.create(req.db, {
      reporterId: req.viewer.id,
      kind,
      targetUserId: body.target_user_id,
      messageId: body.message_id,
      reason: body.reason,
      detail: body.detail,
    });

    if (result.ok) return res.redirect('/reports/mine?done=reported');

    // Back to the form it came from, with the reason it was refused.
    const params = new URLSearchParams();
    if (kind === 'message') {
      params.set('kind', 'message');
      params.set('id', String(body.message_id || ''));
    } else {
      params.set('kind', 'member');

      // The form sends the name back, but a refusal must not depend on it: if it
      // is missing, the account is read so the page can still say who it was.
      let username = String(body.target_username || '').trim();

      if (!username && Number(body.target_user_id)) {
        const row = await req.db
          .prepare('SELECT username FROM users WHERE id = ?')
          .bind(Number(body.target_user_id))
          .first();
        if (row) username = row.username;
      }

      params.set('user', username);
    }
    params.set('failed', result.code);

    return res.redirect(`/reports/new?${params.toString()}`);
  })().catch(next);
});

/** The reports this member filed, and what happened to each. */
router.get('/reports/mine', (req, res, next) => {
  return (async () => {
    if (!ready(req, res)) return;

    const list = await reports.mine(req.db, req.viewer.id);

    return res.render(
      'pages/reports-mine',
      pageContext(req, {
        pageTitle: `My Reports - ${site.name}`,
        authState: 'member',
        entries: list,
        open: list.filter((entry) => entry.status === 'open').length,
        notice: noticeFor(req.query),
      })
    );
  })().catch(next);
});

// ---------- The staff queue ----------

router.get('/admin/reports', staffOnly((req, res, next) => {
  return (async () => {
    const [queue, closed, overview] = await Promise.all([
      reports.queue(req.db),
      reports.closed(req.db),
      adminService.overview(req.db),
    ]);

    return res.render(
      'admin/reports',
      Object.assign(adminLocals(req), {
        queue,
        closed,
        adminStatus: overview.status,
        notice: noticeFor(req.query),
      })
    );
  })().catch(next);
}));

function adminLocals(req) {
  return {
    site,
    viewer: req.viewer,
    admin: req.admin.role,
    currentPath: req.path,
    adminNav: adminService.nav(req.admin.role, req.path, req.query),
    pageTitle: 'Administration - FieldBrik',
  };
}

router.post('/admin/reports/:id/close', staffOnly((req, res, next) => {
  return (async () => {
    const body = req.body || {};

    const result = await reports.close(req.db, {
      id: req.params.id,
      action: body.action,
      note: body.note,
      actor: { id: req.viewer.id, rank: req.admin.role.rank },
    });

    if (!result.ok) return res.redirect(`/admin/reports?failed=${encodeURIComponent(result.code)}`);

    return res.redirect(`/admin/reports?done=${encodeURIComponent(result.code)}`);
  })().catch(next);
}));

module.exports = router;
