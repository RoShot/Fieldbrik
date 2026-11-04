/**
 * Places: the Games listing, a place page, and the pages that create and edit
 * one.
 *
 * This router owns /games because the page router still answers it from the
 * phase 1 fixture list, and routes/pages.js is far too large to upload as one
 * file. It also takes over GET / and GET /my-page for the same reason: both of
 * them read the fixture place list, and the home page's Cool Places row and My
 * Page's place panel now show real published places, so every link from either
 * one resolves to a real page.
 *
 * The home page no longer reads fixtures at all: its news panel comes from the
 * news service, its platform figures are counted from D1, and its online list is
 * real presence. My Page's "View Public Profile" link is the signed-in member's
 * own profile rather than a fixture account.
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
const news = require('../services/news');

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
  published: 'Place published. It is in the Games list now.',
  unpublished: 'Place unpublished. It is out of the Games list; the page still exists for you.',
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

/**
 * The figures in the home page's Platform panel.
 *
 * Four counts, each of something that exists: open accounts, accounts seen in
 * the last five minutes, published places, and catalog items currently on sale.
 * A fresh database honestly reports zeros.
 */
async function platformStats(db) {
  const row = await db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE closed_at IS NULL) AS members,
         (SELECT COUNT(*) FROM users
           WHERE closed_at IS NULL
             AND last_seen_at IS NOT NULL
             AND last_seen_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-5 minutes')) AS online,
         (SELECT COUNT(*) FROM games WHERE published = 1) AS games,
         (SELECT COUNT(*) FROM catalog_items WHERE on_sale = 1) AS items`
    )
    .first();

  return {
    members: Number(row && row.members) || 0,
    online: Number(row && row.online) || 0,
    games: Number(row && row.games) || 0,
    itemsListed: Number(row && row.items) || 0,
  };
}

/** Keeps a facet link on the same query string without losing the selection. */
function facetHref(current, changes) {
  const params = new URLSearchParams();

  Object.entries({ ...current, ...changes }).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });

  const query = params.toString();
  return query ? `/games?${query}` : '/games';
}

// ---------- The listing ----------

router.get('/games', (req, res, next) => {
  return (async () => {
    const query = String(req.query.q || '').trim();
    const creator = String(req.query.creator || '').trim();
    const sort = String(req.query.sort || '');
    const current = { q: query, creator, sort };

    const [list, creators] = req.db
      ? await Promise.all([places.list(req.db, { query, creator, sort }), places.creators(req.db)])
      : [[], []];

    const browseFacets = [
      { label: 'All places', value: '' },
      { label: 'Newest', value: 'newest' },
      { label: 'Recently updated', value: 'updated' },
      { label: 'Name A to Z', value: 'name' },
    ].map((facet) => ({
      label: facet.label,
      active: sort === facet.value || (!sort && facet.value === ''),
      href: facetHref(current, { sort: facet.value }),
    }));

    const creatorFacets = creators.map((name) => ({
      label: name,
      active: creator === name,
      href: facetHref(current, { creator: creator === name ? '' : name }),
    }));

    return res.render(
      'pages/games',
      pageContext(req, {
        pageTitle: `Games - ${site.name}`,
        places: list,
        query,
        browseFacets,
        creatorFacets,
        canCreate: Boolean(req.viewer && req.db),
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

// ---------- The home page and My Page ----------

/**
 * The home page: Cool Places, Latest News, the platform figures and the online
 * list, all from the database. There is no fixture left on this page.
 */
router.get('/', (req, res, next) => {
  return (async () => {
    const db = req.db;

    const [featured, latestNews, stats, online] = db
      ? await Promise.all([
          places.featured(db, 3),
          news.latest(db, 3),
          platformStats(db),
          people.online(db, 12),
        ])
      : [[], [], { members: 0, online: 0, games: 0, itemsListed: 0 }, []];

    return res.render(
      'pages/home',
      pageContext(req, {
        pageTitle: `${site.name} - ${site.tagline.join(' ')}`,
        featured,
        news: latestNews,
        stats,
        online,
      })
    );
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
