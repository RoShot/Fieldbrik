/**
 * Catalog and earning-rate pages for the panel.
 *
 * These sit in their own router rather than inside routes/admin.js, which is by
 * far the largest file in the project. The rules are the same ones the rest of
 * the panel uses: catalog edits need content.review, because they are content
 * decisions, and rates need settings.write, because they are money.
 *
 * The gate below is the same five checks staff() in routes/admin.js applies.
 * The policy it reads - services/permissions - is shared, so the two cannot
 * disagree about who is staff or who holds a capability; only the plumbing that
 * renders a refusal is repeated, and that is deliberately small.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const permissions = require('../services/permissions');
const adminService = require('../services/admin');
const catalogAdmin = require('../services/catalogAdmin');
const settingsService = require('../services/settings');

const router = Router();

function notAllowed(req, res, code, message) {
  return res.status(code).render(
    'pages/error',
    pageContext(req, { pageTitle: 'Not allowed', statusCode: code, message })
  );
}

/**
 * Wraps a page in the panel gate.
 *
 * Registered as a route handler rather than a middleware for the reason
 * routes/admin.js explains: the Worker only waits on a promise a route returns,
 * so an async middleware would let the request reach the 404 page first.
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

/** Locals every panel page needs. Passed explicitly - a missing local throws. */
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

/** Results and refusals, resolved here so a URL never carries a sentence. */
const DONE = {
  catalog_created: 'Item created.',
  catalog_saved: 'Item saved.',
  catalog_on: 'Item is on sale.',
  catalog_off: 'Item taken off sale. Owners keep theirs.',
  rates_saved: 'Earning rates saved.',
};

const FAILED = {
  name: 'A name needs to be between 2 and 60 characters.',
  duplicate: 'Another item already uses that name.',
  category: 'That is not a catalog category.',
  price: 'A price must be a whole number of 0 or more, or empty.',
  both: 'An item needs a price in Tickets, in Bucks, or both.',
  image: 'A picture path must look like /img/name.jpg (png, jpeg, webp or gif).',
  rate: 'A rate must be a whole number between 0 and 1,000,000.',
  value: 'A rate must be a whole number between 0 and 1,000,000.',
  key: 'That is not a setting the panel knows.',
  nobody: 'No account has that ID.',
  refused: 'The item could not be saved.',
};

function noticeFor(query) {
  if (query && DONE[query.done]) return DONE[query.done];
  if (query && FAILED[query.failed]) return FAILED[query.failed];
  return '';
}

// ---------- Catalog ----------
//
// The catalog was seed data, so a new item needed a code change. Nothing in
// these routes deletes an item: members who bought one hold rows that point at
// it, so off sale is the reversible equivalent.

router.get(
  '/admin/catalog',
  staff('content.review', (req, res) => {
    return (async () => {
      const [overview, items] = await Promise.all([
        adminService.overview(req.db),
        catalogAdmin.list(req.db),
      ]);

      return res.render(
        'admin/catalog',
        view(req, {
          adminStatus: overview.status,
          items,
          canEdit: permissions.can(req.admin.role, 'content.review'),
          notice: noticeFor(req.query),
          ...catalogAdmin.facets(),
        })
      );
    })();
  })
);

router.post(
  '/admin/catalog',
  staff('content.review', (req, res) => {
    return (async () => {
      const result = await catalogAdmin.create(req.db, req.body, req.viewer.id);

      if (!result.ok) {
        return res.redirect(`/admin/catalog?failed=${encodeURIComponent(result.code)}`);
      }

      return res.redirect(`/admin/catalog/${result.id}?done=${encodeURIComponent(result.code)}`);
    })();
  })
);

router.get(
  '/admin/catalog/:id',
  staff('content.review', (req, res) => {
    return (async () => {
      const item = await catalogAdmin.find(req.db, req.params.id);
      if (!item) return notAllowed(req, res, 404, 'No catalog item has that ID.');

      const overview = await adminService.overview(req.db);

      return res.render(
        'admin/catalog-item',
        view(req, {
          adminStatus: overview.status,
          item,
          canEdit: permissions.can(req.admin.role, 'content.review'),
          notice: noticeFor(req.query),
          ...catalogAdmin.facets(),
        })
      );
    })();
  })
);

router.post(
  '/admin/catalog/:id',
  staff('content.review', (req, res) => {
    return (async () => {
      const targetId = Number(req.params.id) || 0;
      const result = await catalogAdmin.update(req.db, targetId, req.body, req.viewer.id);

      if (result.code === 'nobody') return res.redirect('/admin/catalog?failed=nobody');

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/catalog/${targetId}?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

router.post(
  '/admin/catalog/:id/sale',
  staff('content.review', (req, res) => {
    return (async () => {
      const targetId = Number(req.params.id) || 0;
      const body = req.body || {};

      const result = await catalogAdmin.setSale(
        req.db,
        targetId,
        String(body.on_sale || '') === '1',
        req.viewer.id
      );

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/catalog?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

// ---------- Earning rates ----------
//
// What a member earns is a setting, not code, so it can be tuned without a
// deploy. Administrator and above: this is money, not moderation.

const RATE_FIELDS = [
  {
    name: 'earn.daily.tickets',
    label: 'Tickets per day - free account',
    note: 'The base daily award for an account with no membership.',
  },
  {
    name: 'earn.daily.tickets.carpenters_club',
    label: 'Tickets per day - Carpenters Club',
    note: 'Replaces the free rate for the day, it is not added to it.',
  },
  {
    name: 'earn.daily.tickets.carpenters_club_senior',
    label: 'Tickets per day - Carpenters Club Senior',
    note: 'Replaces the free rate for the day.',
  },
  {
    name: 'earn.daily.tickets.outrageous_carpenters_club',
    label: 'Tickets per day - Outrageous Carpenters Club',
    note: 'Replaces the free rate for the day.',
  },
  {
    name: 'earn.daily.bucks.outrageous_carpenters_club',
    label: 'Bucks per day - Outrageous Carpenters Club',
    note: "Paid alongside that tier's daily Tickets. Zero means none.",
  },
  {
    name: 'earn.visits.block',
    label: 'Visits per milestone',
    note: 'How many visits on a place it takes to earn one milestone.',
  },
  {
    name: 'earn.visits.tickets',
    label: 'Tickets per visit milestone',
    note: 'Paid to the place owner once per whole block of visits.',
  },
];

router.get(
  '/admin/earnings',
  staff('settings.write', (req, res) => {
    return (async () => {
      const [overview, rates] = await Promise.all([
        adminService.overview(req.db),
        settingsService.all(req.db),
      ]);

      const ladder = [
        { label: 'Free account', tickets: rates['earn.daily.tickets'], bucks: 0 },
        { label: 'Carpenters Club', tickets: rates['earn.daily.tickets.carpenters_club'], bucks: 0 },
        {
          label: 'Carpenters Club Senior',
          tickets: rates['earn.daily.tickets.carpenters_club_senior'],
          bucks: 0,
        },
        {
          label: 'Outrageous Carpenters Club',
          tickets: rates['earn.daily.tickets.outrageous_carpenters_club'],
          bucks: rates['earn.daily.bucks.outrageous_carpenters_club'],
        },
      ];

      return res.render(
        'admin/earnings',
        view(req, {
          adminStatus: overview.status,
          fields: RATE_FIELDS.map((field) => ({ ...field, value: rates[field.name] })),
          ladder,
          visits: { block: rates['earn.visits.block'], tickets: rates['earn.visits.tickets'] },
          maxRate: settingsService.MAX_RATE,
          notice: noticeFor(req.query),
        })
      );
    })();
  })
);

router.post(
  '/admin/earnings',
  staff('settings.write', (req, res) => {
    return (async () => {
      const body = req.body || {};
      const changed = [];

      for (const field of RATE_FIELDS) {
        if (body[field.name] === undefined) continue;

        const result = await settingsService.write(req.db, field.name, body[field.name], req.viewer.id);

        if (!result.ok) return res.redirect(`/admin/earnings?failed=${encodeURIComponent(result.code)}`);

        changed.push(`${field.name}=${result.value}`);
      }

      await req.db
        .prepare(
          `INSERT INTO moderation_log (actor_id, target_id, action, detail, created_at)
           VALUES (?, NULL, 'rates_updated', ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
        )
        .bind(req.viewer.id, changed.join(', ').slice(0, 400))
        .run();

      return res.redirect('/admin/earnings?done=rates_saved');
    })();
  })
);

module.exports = router;
