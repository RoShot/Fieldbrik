/**
 * The member strip's pages, and the site banner: the four that are designed but
 * not built, the Share FieldBrik invitation form, and the panel page that posts
 * the banner.
 *
 * Groups, Advertising, Ambassadors and the referral leaderboard each open a page
 * that says what they will do and what is missing, rather than a 404 or a button
 * that pretends to work. The copy is the scope agreed for this build; none of it
 * is stored yet.
 *
 * Share FieldBrik is a real form: the address and the message are checked on the
 * server and the page reports what happened. What it cannot do is deliver the
 * email, because no mail service is connected to this build; the page says that
 * plainly and hands over the link instead of claiming an invitation was sent.
 *
 * Banners are real: staff at settings.write (rank 240) write a row on
 * /admin/banners, and /banners/current answers with the newest enabled one so
 * every page can draw the strip under the header without a second query blocking.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const permissions = require('../services/permissions');
const adminService = require('../services/admin');
const banners = require('../services/banners');

const PAGES = {
  '/groups': {
    title: 'Groups',
    summary:
      'A group is a named place for members with a shared interest, with its own page, its own member list and a rank for each member.',
    planned: [
      'Creating a group with a name, a description and a badge',
      'Joining and leaving, with the member list shown on the group page',
      'Ranks inside a group, so an owner can hand out officer status',
      'A group wall, moderated the same way the forum is',
    ],
    note: 'There is no groups table yet, so no group can be created, joined or listed.',
  },

  '/advertising': {
    title: 'Advertising',
    summary:
      'Advertising is where a member buys one of the slots on the front page and has their place shown in it.',
    planned: [
      'Buying a slot by size, paid for in Bucks',
      'Uploading the image, with a review before it appears',
      'A start and end date per slot, so a slot cannot be held forever',
      'A record of what a member bought and when it ran',
    ],
    note: 'The front page does not carry member ads yet: the wide boxes there hold places from this database. When the slots open, they replace those boxes.',
  },

  '/ambassadors': {
    title: 'Ambassadors',
    summary:
      'Ambassadors are members who bring other members to FieldBrik and are recognised for it.',
    planned: [
      'A share link per member, so a new sign-up can be credited to whoever sent it',
      'A count of the members each ambassador brought in',
      'Recognition on the profile of whoever brought them in',
      'A leaderboard, once there are enough members for one to mean anything',
    ],
    note: 'Nothing is tracked yet: sign-ups are not credited to anybody, so there is no figure to show.',
  },

  '/share/referrals': {
    title: 'Referral Leaderboards',
    summary:
      'A referral leaderboard ranks members by how many other members they brought to the site.',
    planned: [
      'A table of members ordered by invitations that turned into accounts',
      'A period filter, so a month can be looked at on its own',
      'A place on the profile for the figure',
    ],
    note: 'This waits on invitations being counted at all: there is nothing to rank yet.',
  },
};

// ---------------------------------------------------------------------------
// Share FieldBrik
// ---------------------------------------------------------------------------

const DEFAULT_MESSAGE = `Check out ${site.name}, this awesome free game I found on the internets!`;
const MESSAGE_MAX = 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function invitedValues(req) {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const message = String(body.message || '').trim();

  return {
    name: name || (req.viewer ? req.viewer.username : ''),
    email: String(body.email || '').trim(),
    message: message || DEFAULT_MESSAGE,
  };
}

function renderShare(req, res, values, result) {
  return res.render(
    'pages/share',
    pageContext(req, {
      pageTitle: `Share ${site.name} with a Friend - ${site.name}`,
      extraCss: '/css/share2009.css',
      bodyClass: 'fb-share-page',
      values,
      result,
      inviteLink: `https://${site.domain}/`,
    })
  );
}

const router = Router();

router.get('/share', (req, res) => {
  return renderShare(req, res, invitedValues(req), null);
});

// The strip's Share menu still points at the old invitation page. It is the same
// form, so send the link to it rather than keeping a second placeholder alive.
router.get('/share/invite', (req, res) => res.redirect('/share'));

// The button checks the form and reports the truth: this build cannot send mail,
// so an accepted form hands back the link rather than claiming a delivery.
router.post('/share', (req, res) => {
  const values = invitedValues(req);

  if (!values.email) {
    return renderShare(req, res, values, {
      ok: false,
      text: 'Add the email address of the friend you want to invite.',
    });
  }

  if (!EMAIL.test(values.email)) {
    return renderShare(req, res, values, {
      ok: false,
      text: `That does not look like an email address. Check the address and try again.`,
    });
  }

  if (values.message.length > MESSAGE_MAX) {
    return renderShare(req, res, values, {
      ok: false,
      text: `Keep the message under ${MESSAGE_MAX} characters; this one is ${values.message.length}.`,
    });
  }

  return renderShare(req, res, values, {
    ok: true,
    text:
      'The address and the message are fine, but nothing was sent: no mail service is connected to ' +
      'this build, so invitations cannot be emailed yet. Copy the link below and send it yourself. ' +
      'The address is not stored anywhere.',
  });
});

// ---------------------------------------------------------------------------
// The site banner
// ---------------------------------------------------------------------------

/**
 * What the strip needs, and nothing else: no ids, no operator notes.
 *
 * No file extension in the path on purpose: a request for a dotted path is
 * treated as an asset first, and an asset that is not there never reaches the
 * router.
 */
router.get('/banners/current', (req, res) => {
  return (async () => {
    if (!req.db) return res.json({ banner: null });

    const banner = await banners.active(req.db);

    res.setHeader('cache-control', 'no-store');
    return res.json({
      banner: banner
        ? { text: banner.text, bg: banner.bg, fg: banner.fg, link: banner.link }
        : null,
    });
  })().catch(() => res.json({ banner: null }));
});

function notAllowed(req, res, code, message) {
  return res.status(code).render(
    'pages/error',
    pageContext(req, { pageTitle: 'Not allowed', statusCode: code, message })
  );
}

/**
 * The panel gate, the same five checks the other panel routers apply. Settings
 * are the highest thing in the panel besides roles and deletions, so the
 * capability is settings.write rather than "any staff".
 */
function settingsOnly(handler) {
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

      if (!permissions.can(role, 'settings.write')) {
        return notAllowed(req, res, 403, 'Your role cannot change site settings.');
      }

      req.admin = { role };
      return handler(req, res);
    })().catch(next);
  };
}

const DONE = {
  created: 'Banner saved.',
  shown: 'Banner switched on.',
  hidden: 'Banner switched off.',
  removed: 'Banner deleted.',
};

const FAILED = {
  text: 'Banner text needs to be between 2 and 200 characters.',
  bg: 'The background needs to be a hex colour, like #efefef.',
  fg: 'The text colour needs to be a hex colour, like #1e1e1e.',
  link: 'A link must be a path on this site (/news) or a full https address.',
  nobanner: 'No banner has that id.',
};

function noticeFor(query) {
  if (query && DONE[query.done]) return DONE[query.done];
  if (query && FAILED[query.failed]) return FAILED[query.failed];
  return '';
}

/** Panel locals. The Banners entry in the side menu comes from sidebar.ejs. */
function panelView(req, extra) {
  return Object.assign(
    {
      site,
      viewer: req.viewer,
      admin: req.admin.role,
      currentPath: req.path,
      adminNav: adminService.nav(req.admin.role, req.path, req.query),
      pageTitle: 'Site banners - FieldBrik',
    },
    extra || {}
  );
}

const BLANK_FORM = { text: '', bg: '#efefef', fg: '#1e1e1e', link: '', enabled: true };

router.get(
  '/admin/banners',
  settingsOnly((req, res) => {
    return (async () => {
      const [overview, saved] = await Promise.all([
        adminService.overview(req.db),
        banners.list(req.db),
      ]);

      const shown = saved.find((entry) => entry.enabled) || null;

      return res.render(
        'admin/banners',
        panelView(req, {
          adminStatus: overview.status,
          banners: saved,
          shownId: shown ? shown.id : 0,
          form: BLANK_FORM,
          notice: noticeFor(req.query),
        })
      );
    })();
  })
);

router.post(
  '/admin/banners',
  settingsOnly((req, res) => {
    return (async () => {
      const body = req.body || {};

      const result = await banners.create(req.db, {
        text: body.text,
        bg: body.bg || body.bg_hex,
        fg: body.fg || body.fg_hex,
        link: body.link,
        enabled: String(body.enabled) === '1',
        actorId: req.viewer.id,
      });

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/banners?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

router.post(
  '/admin/banners/:id/status',
  settingsOnly((req, res) => {
    return (async () => {
      const body = req.body || {};

      const result = await banners.setEnabled(req.db, {
        id: Number(req.params.id) || 0,
        enabled: String(body.enabled) === '1',
      });

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/banners?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

router.post(
  '/admin/banners/:id/delete',
  settingsOnly((req, res) => {
    return (async () => {
      const result = await banners.remove(req.db, { id: Number(req.params.id) || 0 });

      const key = result.ok ? 'done' : 'failed';
      return res.redirect(`/admin/banners?${key}=${encodeURIComponent(result.code)}`);
    })();
  })
);

Object.keys(PAGES).forEach((path) => {
  router.get(path, (req, res) => {
    const meta = PAGES[path];

    return res.render(
      'pages/in-development',
      pageContext(req, {
        pageTitle: `${meta.title} - ${site.name}`,
        meta,
      })
    );
  });
});

module.exports = router;
