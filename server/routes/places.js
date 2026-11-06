/**
 * Places: the front page, a place page, and the pages that create and edit one.
 *
 * This router owns /home, /games and GET / because the page router still answers
 * them from the phase 1 fixture list, and routes/pages.js is far too large to
 * upload as one file.
 *
 * The front page and the old Games listing were two versions of the same screen,
 * so they are now one page at /home: / and /games both redirect there. Everything
 * on it reads D1 - the member's friendships, the member's own places, and every
 * published place - so there is no fixture left on the front of the site.
 *
 * Mounted before the page router, so everything it does not answer - /people,
 * /forum, /catalog and the rest - still falls through.
 */

const { Router } = require('../lib/router');

const site = require('../config/site');
const pageContext = require('../services/pageContext');
const places = require('../services/places');
const people = require('../services/people');
const notices = require('../services/notices');
const permissions = require('../services/permissions');

const router = Router();

/**
 * The links on My Page's profile panel, same order as the page router's. The
 * profile link is built per request: the fixture version pointed at
 * /people/BrikFounder, which is a 404 on a database where that account never
 * existed.
 */
function profileLinksFor(viewer) {
  return [
    { label: 'Friends', href: '/friends' },
    { label: 'Change Character', href: '/character' },
    { label: 'Account Settings', href: '/settings' },
    { label: 'Messages', href: '/messages' },
    { label: 'Inventory', href: '/inventory' },
    { label: 'View Public Profile', href: `/people/${encodeURIComponent(viewer.username)}` },
    { label: 'Log Out', href: '/logout' },
  ];
}

const DONE = {
  created: 'Place created. Publish it when you are ready for other members to see it.',
  saved: 'Place saved.',
  published: 'Place published. It is on the front page now.',
  unpublished: 'Place unpublished. It is off the front page; the page still exists for you.',
};

const FAILED = {
  name: `A place name needs to be between ${places.NAME_MIN} and ${places.NAME_MAX} characters.`,
  description: `A description can be up to ${places.DESC_MAX} characters.`,
  no_place: 'That place does not exist.',
  not_yours: 'That place belongs to another member.',
  refused: 'The place was not saved.',
};

function noticeFor(query) {
  const done = DONE[String((query || {}).done || '')];
  if (done) return done;

  const failed = String((query || {}).failed || '');
  if (!failed) return null;

  return FAILED[failed] || FAILED.refused;
}

// ---------- The front page ----------

// One front page. Everything that still links to / lands on it.
router.get('/', (req, res) => res.redirect('/home'));

// A link to the old listing is a link to the front page; a search term travels
// with it rather than being dropped.
router.get('/games', (req, res) => {
  const query = String(req.query.q || '').trim();
  return res.redirect(query ? `/home?q=${encodeURIComponent(query)}` : '/home');
});

/**
 * The front page: friends, your own places, and every published place.
 *
 * Friends are the viewer's accepted friendships. Continue is the viewer's own
 * places, drafts included, because a half-built place is exactly the thing to
 * pick up again. The grid is every published place, and the search box filters
 * it by name or creator.
 *
 * canOpenPanel comes from the role table on every request, so the sidebar's
 * Panel button appears for Intern and above and for nobody else. The panel
 * gates itself as well; this only decides whether the door is drawn.
 */
router.get('/home', (req, res, next) => {
  return (async () => {
    const db = req.db;
    const viewer = req.viewer;
    const query = String(req.query.q || '').trim();

    const [friends, ownPlaces, recommended] = db
      ? await Promise.all([
          viewer ? people.friendsOf(db, viewer.id) : [],
          viewer ? places.mine(db, viewer.id) : [],
          places.list(db, { query }),
        ])
      : [[], [], []];

    const role = viewer && db ? await permissions.roleOf(db, viewer.id) : null;

    return res.render(
      'pages/home',
      pageContext(req, {
        pageTitle: `${site.name} - Home`,
        extraCss: '/css/app.css',
        bodyClass: 'fb-app',
        query,
        friends: friends.slice(0, 9),
        friendTotal: viewer ? viewer.stats.friends : 0,
        continuePlaces: ownPlaces.slice(0, 5),
        recommended: recommended.slice(0, 10),
        canOpenPanel: permissions.can(role, 'admin.open'),
      })
    );
  })().catch(next);
});

// ---------- One place ----------

router.get('/games/:slug', (req, res, next) => {
  return (async () => {
    if (!req.db) {
      return res.status(404).render(
        'pages/error',
        pageContext(req, {
          pageTitle: `Place not found - ${site.name}`,
          statusCode: 404,
          message: 'That place is not listed on FieldBrik.',
        })
      );
    }

    const place = await places.findOne(req.db, req.params.slug);
    const isOwner = Boolean(req.viewer && place && place.creatorId === req.viewer.id);

    // A draft is not a secret from its owner, and it is nobody else's business:
    // a stranger gets the same 404 as for a name that never existed.
    if (!place || (!place.published && !isOwner)) {
      return res.status(404).render(
        'pages/error',
        pageContext(req, {
          pageTitle: `Place not found - ${site.name}`,
          statusCode: 404,
          message: 'That place is not listed on FieldBrik.',
        })
      );
    }

    const creator = await people.findOne(req.db, place.creator);

    return res.render(
      'pages/game',
      pageContext(req, {
        pageTitle: `${place.name} - ${site.name}`,
        place,
        creator,
        isOwner,
        notice: noticeFor(req.query),
      })
    );
  })().catch(next);
});

// ---------- Creating and editing ----------

/** A place form, for a new place and for editing an existing one. */
function renderForm(req, res, status, place, failure) {
  return res.status(status).render(
    'pages/place-edit',
    pageContext(req, {
      pageTitle: place ? `Edit ${place.name} - ${site.name}` : `New Place - ${site.name}`,
      authState: 'member',
      place,
      failure: failure || null,
      notice: failure ? null : noticeFor(req.query),
    })
  );
}

router.get('/places/new', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.redirect('/games');
    return renderForm(req, res, 200, null, null);
  })().catch(next);
});

router.post('/places', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.redirect('/games');

    const body = req.body || {};

    const result = await places.create(req.db, {
      creatorId: req.viewer.id,
      name: body.name,
      description: body.description,
      published: body.published === '1',
    });

    if (!result.ok) {
      return renderForm(
        req,
        res,
        400,
        {
          id: null,
          name: String(body.name || ''),
          description: String(body.description || ''),
          published: false,
          slug: '',
        },
        FAILED[result.code] || FAILED.refused
      );
    }

    return res.redirect(`/places/${result.place.id}/edit?done=created`);
  })().catch(next);
});

router.get('/places/mine', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.redirect('/places/new');

    const list = await places.mine(req.db, req.viewer.id);

    return res.render(
      'pages/places-mine',
      pageContext(req, {
        pageTitle: `My Places - ${site.name}`,
        authState: 'member',
        places: list,
        published: list.filter((place) => place.published).length,
        notice: noticeFor(req.query),
      })
    );
  })().catch(next);
});

router.get('/places/:id/edit', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.redirect('/places/new');

    const place = await places.findById(req.db, req.params.id);

    if (!place) {
      return res.status(404).render(
        'pages/error',
        pageContext(req, {
          pageTitle: `Place not found - ${site.name}`,
          statusCode: 404,
          message: FAILED.no_place,
        })
      );
    }

    if (place.creatorId !== req.viewer.id) {
      return res.status(403).render(
        'pages/error',
        pageContext(req, {
          pageTitle: `Not your place - ${site.name}`,
          statusCode: 403,
          message: FAILED.not_yours,
        })
      );
    }

    return renderForm(req, res, 200, place, null);
  })().catch(next);
});

router.post('/places/:id', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.redirect('/places/new');

    const body = req.body || {};
    const back = `/places/${Number(req.params.id) || 0}/edit`;

    const result = await places.update(req.db, {
      placeId: req.params.id,
      actorId: req.viewer.id,
      name: body.name,
      description: body.description,
    });

    if (!result.ok) return res.redirect(`${back}?failed=${encodeURIComponent(result.code)}`);

    return res.redirect(`${back}?done=saved`);
  })().catch(next);
});

router.post('/places/:id/status', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');
    if (!req.db) return res.redirect('/places/new');

    const body = req.body || {};

    const result = await places.setPublished(req.db, {
      placeId: req.params.id,
      actorId: req.viewer.id,
      published: body.published === '1',
    });

    if (!result.ok) return res.redirect(`/places/mine?failed=${encodeURIComponent(result.code)}`);

    return res.redirect(`/places/mine?done=${encodeURIComponent(result.code)}`);
  })().catch(next);
});

/**
 * My Page.
 *
 * The place panel used to show three fixture games, and the friends panel three
 * fixture members: both were links to pages that do not exist. The panel now
 * shows the newest real places, and the friends are this member's real accepted
 * friendships, so every avatar on the page opens a real profile.
 */
router.get('/my-page', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.redirect('/login');

    const db = req.db;
    const viewer = req.viewer;

    const [heldBadges, warnings, friends, newest] = db
      ? await Promise.all([
          people.badgesFor(db, viewer.id),
          notices.warnings(db, viewer.id),
          people.friendsOf(db, viewer.id),
          places.featured(db, 3),
        ])
      : [[], [], [], []];

    return res.render(
      'pages/my-page',
      pageContext(req, {
        pageTitle: `My Page - ${site.name}`,
        authState: 'member',
        viewer,
        friends: friends.slice(0, 6),
        friendTotal: viewer.stats.friends,
        newestPlaces: newest,
        heldBadges,
        warnings,
        profileLinks: profileLinksFor(viewer),
      })
    );
  })().catch(next);
});

module.exports = router;
