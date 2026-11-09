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
const placeFiles = require('../services/placeFiles');
const placeThumbnails = require('../services/placeThumbnails');
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
  file: 'Place file published. The newest version is now available to download.',
  thumbnail: 'Thumbnail saved. It is on the place page and on its tiles now.',
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

const FILE_FAILED = {
  no_place: 'That place does not exist.',
  not_yours: 'That place belongs to another member.',
  filename: 'The file needs a name ending in .fbrx, .rbxl, .rbxlx or .xml.',
  format: 'Only XML place files are accepted. Save the place as XML first.',
  empty: 'That file is empty.',
  size: `A place file can be up to ${placeFiles.MAX_BYTES / (1024 * 1024)} MB.`,
  content:
    'That is not a FieldBrik or Roblox XML place. A .fbrx or .rbxlx file has a <roblox> root; a binary .rbxl has to be saved as XML first.',
  refused: 'The place file was not saved. Try publishing it again.',
};

const THUMBNAIL_FAILED = {
  no_place: 'That place does not exist.',
  not_yours: 'That place belongs to another member.',
  empty: 'That picture is empty.',
  size: `A thumbnail can be up to ${Math.round(placeThumbnails.MAX_BYTES / 1024)} KB.`,
  format: 'A thumbnail has to be a PNG or JPEG image.',
  refused: 'The thumbnail was not saved. Try another picture.',
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

// ---------- The Games listing ----------

/** Browse order. Visits are not counted, so there is no popularity order. */
const GAME_BROWSE = {
  updated: {
    label: 'Recently Updated',
    compare: (a, b) => b.updated.localeCompare(a.updated) || b.id - a.id,
  },
  newest: {
    label: 'Newest',
    compare: (a, b) => b.created.localeCompare(a.created) || b.id - a.id,
  },
};

/** Time windows, counted back from today on the day a place last changed. */
const GAME_TIME = {
  now: { label: 'Now', days: 0 },
  day: { label: 'Past Day', days: 1 },
  week: { label: 'Past Week', days: 7 },
  month: { label: 'Past Month', days: 31 },
  all: { label: 'All-time', days: null },
};

const GAMES_PER_PAGE = 9;

/** The date `days` before today, in the shape the places service stores. */
function dayBefore(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Whole days since a stored date, in words. */
function updatedLabel(value) {
  const then = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(then.getTime())) return 'unknown';

  const days = Math.floor((Date.now() - then.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;

  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/** A facet or page link, keeping the current selection. */
function gamesHref(current, changes) {
  const params = new URLSearchParams();
  const merged = Object.assign({}, current, changes);

  Object.keys(merged).forEach((key) => {
    const value = merged[key];
    if (value === undefined || value === null || value === '') return;
    if (key === 'page' && Number(value) === 1) return;
    params.set(key, value);
  });

  const query = params.toString();
  return query ? `/games?${query}` : '/games';
}

/**
 * The Games listing: every published place, nine to a page.
 *
 * The facets are the reference's Browse and Time groups, wired to the facts this
 * database has: the order a place last changed in, and the day it last changed.
 */
router.get('/games', (req, res, next) => {
  return (async () => {
    const query = String(req.query.q || '').trim();
    const browseKey = GAME_BROWSE[String(req.query.sort || '')] ? String(req.query.sort) : 'updated';
    const timeKey = GAME_TIME[String(req.query.time || '')] ? String(req.query.time) : 'all';
    const wanted = Math.max(1, Number(req.query.page) || 1);

    const published = req.db ? await places.list(req.db, { query }) : [];

    const days = GAME_TIME[timeKey].days;
    const since = days === null ? null : dayBefore(days);
    const inWindow = since ? published.filter((place) => place.updated >= since) : published;

    const sorted = inWindow.slice().sort(GAME_BROWSE[browseKey].compare);
    const totalPages = Math.max(1, Math.ceil(sorted.length / GAMES_PER_PAGE));
    const page = Math.min(wanted, totalPages);
    const start = (page - 1) * GAMES_PER_PAGE;
    const tiles = sorted.slice(start, start + GAMES_PER_PAGE).map((place) =>
      Object.assign({}, place, { updatedLabel: updatedLabel(place.updated) })
    );

    const current = {
      q: query,
      sort: browseKey === 'updated' ? '' : browseKey,
      time: timeKey === 'all' ? '' : timeKey,
    };

    const browseFacets = Object.keys(GAME_BROWSE).map((key) => ({
      label: GAME_BROWSE[key].label,
      active: browseKey === key,
      href: gamesHref(current, { sort: key === 'updated' ? '' : key, page: 1 }),
    }));

    const timeFacets = Object.keys(GAME_TIME).map((key) => ({
      label: GAME_TIME[key].label,
      active: timeKey === key,
      href: gamesHref(current, { time: key === 'all' ? '' : key, page: 1 }),
    }));

    return res.render(
      'pages/games',
      pageContext(req, {
        pageTitle: `Games - ${site.name}`,
        extraCss: '/css/games2009.css',
        bodyClass: 'fb-games-page',
        query,
        tiles,
        total: sorted.length,
        page,
        totalPages,
        heading: `${GAME_BROWSE[browseKey].label} (${GAME_TIME[timeKey].label})`,
        browseFacets,
        timeFacets,
        prevHref: page > 1 ? gamesHref(current, { page: page - 1 }) : null,
        nextHref: page < totalPages ? gamesHref(current, { page: page + 1 }) : null,
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

    const [creator, placeFile] = await Promise.all([
      people.findOne(req.db, place.creator),
      placeFiles.latest(req.db, place.id),
    ]);

    return res.render(
      'pages/game',
      pageContext(req, {
        pageTitle: `${place.name} - ${site.name}`,
        place,
        creator,
        placeFile,
        isOwner,
        notice: noticeFor(req.query),
      })
    );
  })().catch(next);
});

/**
 * The newest place file.
 *
 * A published place's file is public; a draft's file is only for its owner,
 * exactly like the place page. It is always an attachment: XML is served as
 * XML, never as a page a browser might render.
 */
router.get('/games/:slug/file', (req, res, next) => {
  return (async () => {
    if (!req.db) return res.status(404).send('No place file has been published.');

    const place = await places.findOne(req.db, req.params.slug);
    const isOwner = Boolean(req.viewer && place && place.creatorId === req.viewer.id);

    if (!place || (!place.published && !isOwner)) {
      return res.status(404).send('No place file has been published.');
    }

    const file = await placeFiles.latestContent(req.db, place.id);
    if (!file) return res.status(404).send('No place file has been published.');

    res.setHeader('Content-Type', file.mime);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(file.content);
  })().catch(next);
});

/**
 * A place's thumbnail.
 *
 * The picture is public with the place and private with a draft, exactly like
 * the place page and the place file. `Cache-Control` lets a browser and a shared
 * cache keep it, so a tile does not ask again for every visit; the `v` in the
 * tile's address changes whenever a new picture is saved.
 */
router.get('/games/:slug/thumbnail', (req, res, next) => {
  return (async () => {
    if (!req.db) return res.status(404).send('No thumbnail.');

    const place = await places.findOne(req.db, req.params.slug);
    const isOwner = Boolean(req.viewer && place && place.creatorId === req.viewer.id);

    if (!place || (!place.published && !isOwner)) return res.status(404).send('No thumbnail.');

    const image = await placeThumbnails.latest(req.db, place.id);
    if (!image) return res.status(404).send('No thumbnail.');

    res.setHeader('Content-Type', image.type);
    res.setHeader('Content-Length', String(image.bytes.length));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', place.published ? 'public, max-age=300' : 'private, no-store');
    res.setHeader('ETag', image.etag);

    if (String(req.headers['if-none-match'] || '') === image.etag) return res.status(304).end();

    // Express takes a Buffer from send(); the Worker needs sendBytes, because its
    // send() turns anything into text.
    return typeof res.sendBytes === 'function' ? res.sendBytes(image.bytes) : res.send(image.bytes);
  })().catch(next);
});

// ---------- Creating and editing ----------

/** A place form, for a new place and for editing an existing one. */
function renderForm(req, res, status, place, failure, files) {
  return res.status(status).render(
    'pages/place-edit',
    pageContext(req, {
      pageTitle: place ? `Edit ${place.name} - ${site.name}` : `New Place - ${site.name}`,
      authState: 'member',
      place,
      latestFile: files ? files.latest : null,
      fileHistory: files ? files.history : [],
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

    const [latestFile, fileHistory] = await Promise.all([
      placeFiles.latest(req.db, place.id),
      placeFiles.history(req.db, place.id, 5),
    ]);

    return renderForm(req, res, 200, place, null, {
      latest: latestFile,
      history: fileHistory,
    });
  })().catch(next);
});

/**
 * Publish a place file.
 *
 * The site sends JSON because the browser has read the file; Studio sends the
 * XML itself with its filename in X-FieldBrik-Filename. Both arrive here as
 * body.content plus body.filename, and the same service validates both.
 */
router.post('/places/:id/file', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.status(401).json({ ok: false, error: 'Sign in first.' });
    if (!req.db) {
      return res.status(503).json({ ok: false, error: 'Publishing a place needs the database.' });
    }

    const raw = req.body || {};
    const body = typeof raw === 'string' ? { content: raw } : raw;
    const headers = req.headers || {};

    // Studio may be given the readable place address rather than the numeric
    // edit id. Resolve a slug to the row it names; the service still checks
    // ownership, so a guess cannot publish to somebody else's place.
    const requested = String(req.params.id || '');
    let placeId = requested;
    if (!/^\d+$/.test(requested)) {
      const resolved = await places.findOne(req.db, requested);
      if (resolved) placeId = resolved.id;
    }

    const result = await placeFiles.addVersion(req.db, {
      placeId,
      actorId: req.viewer.id,
      filename: body.filename || headers['x-fieldbrik-filename'] || req.query.filename,
      content: body.content,
      note: body.note || req.query.note,
    });

    if (!result.ok) {
      const status = result.code === 'no_place' ? 404 : result.code === 'not_yours' ? 403 : 400;
      return res.status(status).json({
        ok: false,
        code: result.code,
        error: FILE_FAILED[result.code] || FILE_FAILED.refused,
      });
    }

    return res.status(201).json({
      ok: true,
      code: result.code,
      file: result.file,
      edit: `/places/${Number(placeId) || 0}/edit`,
    });
  })().catch(next);
});

/**
 * Save a place thumbnail.
 *
 * The browser has already cropped and shrunk the picture, so it arrives as one
 * base64 string in JSON. Nothing trusts the declared type: the service reads the
 * first bytes and refuses anything that is not a PNG or JPEG.
 */
router.post('/places/:id/thumbnail', (req, res, next) => {
  return (async () => {
    if (!req.viewer) return res.status(401).json({ ok: false, error: 'Sign in first.' });
    if (!req.db) {
      return res.status(503).json({ ok: false, error: 'Saving a thumbnail needs the database.' });
    }

    const raw = req.body || {};
    const body = typeof raw === 'string' ? { content: raw } : raw;

    const result = await placeThumbnails.set(req.db, {
      placeId: req.params.id,
      actorId: req.viewer.id,
      content: body.content,
    });

    if (!result.ok) {
      const status = result.code === 'no_place' ? 404 : result.code === 'not_yours' ? 403 : 400;
      return res.status(status).json({
        ok: false,
        code: result.code,
        error: THUMBNAIL_FAILED[result.code] || THUMBNAIL_FAILED.refused,
      });
    }

    return res.status(201).json({ ok: true, code: result.code, thumbnail: result.thumbnail });
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
// The two pages are separate again: / is the front door, /home is the member's
// own page. They shared one screen for a pass; the Games listing now has an
// address of its own, so the home screen goes back to being a home screen.

/**
 * The front page at /: every published place, in the 2009 arrangement.
 *
 * The search box filters the grid by name or creator. canOpenPanel comes from
 * the role table on every request, so the panel door is drawn for staff only;
 * the panel gates itself as well.
 */
router.get('/', (req, res, next) => {
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
        pageTitle: `${site.name} - ${site.tagline.join(' ')}`,
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

/**
 * The member home, drawn by /home and by /my-page.
 *
 * /home is the member's own page, the way the classic site's My Home was. The
 * address /my-page stays because every link and every panel still uses it, and
 * both draw the same view from the same rows.
 */
async function renderMemberHome(req, res, title) {
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
      pageTitle: `${title} - ${site.name}`,
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
}

// A guest has no home of their own, so /home sends them to the front door rather
// than to a sign-in form they did not ask for. /my-page, which members reach
// from their own links, still asks them to sign in.
router.get('/home', (req, res, next) => {
  if (!req.viewer) return res.redirect('/');
  return renderMemberHome(req, res, 'Home').catch(next);
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
  if (!req.viewer) return res.redirect('/login');
  return renderMemberHome(req, res, 'My Page').catch(next);
});

module.exports = router;
